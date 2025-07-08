// lib/database.js - 깔끔한 버전
import mysql from "mysql2/promise";

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
        this.connectionCount = 0;
        this.activeConnections = new Set();
    }

    initializePool() {
        if (this.isInitialized && this.pool) {
            return this.pool;
        }

        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 3,
                queueLimit: 0,
                timezone: "+09:00",
                acquireTimeout: 30000,
                timeout: 30000,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0,
                reconnect: true,
                multipleStatements: false,
                charset: 'utf8mb4'
            });

            this.pool.on('connection', (connection) => {
                this.connectionCount++;
                console.log(`새 연결 생성됨 ID: ${connection.threadId}, 총 연결: ${this.connectionCount}`);
            });

            this.pool.on('error', (err) => {
                console.error('MySQL Pool Error:', err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
                    err.code === 'ECONNRESET' || 
                    err.code === 'PROTOCOL_ENQUEUE_AFTER_QUIT') {
                    this.handleDisconnect();
                }
            });

            this.isInitialized = true;
            console.log('데이터베이스 연결 풀이 초기화되었습니다.');
            return this.pool;

        } catch (error) {
            console.error('데이터베이스 풀 초기화 실패:', error);
            this.isInitialized = false;
            this.pool = null;
            throw error;
        }
    }

    handleDisconnect() {
        console.log('데이터베이스 연결이 끊어졌습니다. 재초기화를 진행합니다...');
        this.isInitialized = false;
        this.pool = null;
        this.connectionCount = 0;
        this.activeConnections.clear();
        
        setTimeout(() => {
            try {
                this.initializePool();
            } catch (error) {
                console.error('재연결 실패:', error);
            }
        }, 2000);
    }

    async executeQuery(query, params = []) {
        const pool = this.initializePool();
        let connection = null;
        const connectionId = Date.now() + Math.random();
        
        try {
            this.activeConnections.add(connectionId);
            console.log(`쿼리 시작 [${connectionId}] - 활성 연결: ${this.activeConnections.size}`);
            
            connection = await pool.getConnection();
            
            // 트랜잭션 관련 명령어는 query() 사용, 나머지는 execute() 사용
            const transactionCommands = ['START TRANSACTION', 'COMMIT', 'ROLLBACK', 'BEGIN'];
            const isTransactionCommand = transactionCommands.some(cmd => 
                query.trim().toUpperCase().startsWith(cmd)
            );
            
            let results;
            if (isTransactionCommand) {
                [results] = await connection.query(query, params);
            } else {
                [results] = await connection.execute(query, params);
            }
            
            console.log(`쿼리 완료 [${connectionId}] - 결과: ${Array.isArray(results) ? results.length : 1}건`);
            return results;

        } catch (error) {
            console.error(`쿼리 실행 오류 [${connectionId}]:`, error.message);
            console.error("Query:", query.substring(0, 200) + (query.length > 200 ? '...' : ''));
            
            if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
                error.code === 'ECONNRESET' ||
                error.code === 'PROTOCOL_ENQUEUE_AFTER_QUIT') {
                this.handleDisconnect();
            }
            
            throw error;
        } finally {
            if (connection) {
                try {
                    connection.release();
                    console.log(`연결 해제됨 [${connectionId}]`);
                } catch (releaseError) {
                    console.error(`연결 해제 오류 [${connectionId}]:`, releaseError.message);
                }
            }
            this.activeConnections.delete(connectionId);
        }
    }

    async getConnection() {
        const pool = this.initializePool();
        return await pool.getConnection();
    }

    async startTransaction() {
        const pool = this.initializePool();
        const connection = await pool.getConnection();
        await connection.query('START TRANSACTION');
        return connection;
    }

    async commitTransaction(connection) {
        await connection.query('COMMIT');
        connection.release();
    }

    async rollbackTransaction(connection) {
        await connection.query('ROLLBACK');
        connection.release();
    }

    async closePool() {
        if (this.pool) {
            try {
                await this.pool.end();
                console.log('데이터베이스 연결 풀이 정상적으로 종료되었습니다.');
            } catch (error) {
                console.error('연결 풀 종료 중 오류:', error);
            } finally {
                this.isInitialized = false;
                this.pool = null;
                this.connectionCount = 0;
                this.activeConnections.clear();
            }
        }
    }

    getPoolStatus() {
        if (!this.pool) {
            return {
                status: 'not_initialized',
                totalConnections: 0,
                freeConnections: 0,
                acquiringConnections: 0,
                connectionLimit: 3,
                activeQueries: this.activeConnections.size,
                poolReady: false
            };
        }

        try {
            const poolData = this.pool.pool;
            const config = this.pool.config;
            
            let totalConnections = 0;
            let freeConnections = 0;
            let acquiringConnections = 0;

            if (poolData && typeof poolData === 'object') {
                if (poolData._allConnections && Array.isArray(poolData._allConnections)) {
                    totalConnections = poolData._allConnections.length;
                }
                if (poolData._freeConnections && Array.isArray(poolData._freeConnections)) {
                    freeConnections = poolData._freeConnections.length;
                }
                if (poolData._acquiringConnections && Array.isArray(poolData._acquiringConnections)) {
                    acquiringConnections = poolData._acquiringConnections.length;
                }
            }

            return {
                status: 'active',
                totalConnections,
                freeConnections,
                acquiringConnections,
                connectionLimit: config ? config.connectionLimit : 3,
                activeQueries: this.activeConnections.size,
                poolReady: true,
                isInitialized: this.isInitialized
            };

        } catch (error) {
            console.warn('풀 상태 조회 중 오류:', error.message);
            return {
                status: 'error',
                totalConnections: 'N/A',
                freeConnections: 'N/A',
                acquiringConnections: 'N/A',
                connectionLimit: 3,
                activeQueries: this.activeConnections.size,
                poolReady: false,
                error: error.message
            };
        }
    }

    async testConnection() {
        try {
            await this.executeQuery("SELECT 1 as test");
            return { success: true, message: "연결 테스트 성공" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// 싱글톤 인스턴스 생성
const dbManager = new DatabaseManager();

// Export functions
export const executeQuery = async (query, params = []) => {
    return await dbManager.executeQuery(query, params);
};

export const getConnection = async () => {
    return await dbManager.getConnection();
};

export const startTransaction = async () => {
    return await dbManager.startTransaction();
};

export const commitTransaction = async (connection) => {
    return await dbManager.commitTransaction(connection);
};

export const rollbackTransaction = async (connection) => {
    return await dbManager.rollbackTransaction(connection);
};

export const getPoolStatus = () => {
    return dbManager.getPoolStatus();
};

export const closeDatabase = async () => {
    return await dbManager.closePool();
};

export const testDatabaseConnection = async () => {
    return await dbManager.testConnection();
};

// Next.js 개발 환경에서 Hot Reload 시 연결 정리
if (process.env.NODE_ENV === 'development') {
    if (global.__db_pool_cleanup) {
        global.__db_pool_cleanup();
    }
    global.__db_pool_cleanup = () => dbManager.closePool();
}

// 프로세스 종료 시 정리
process.on('SIGINT', async () => {
    console.log('애플리케이션 종료 중... 데이터베이스 연결을 정리합니다.');
    await dbManager.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('애플리케이션 종료 중... 데이터베이스 연결을 정리합니다.');
    await dbManager.closePool();
    process.exit(0);
});

export default dbManager;