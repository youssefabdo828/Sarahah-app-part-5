import dotenv from 'dotenv'



dotenv.config({ path: [`.${process.env.NODE_ENV}.env`, '.env'] })



const envConfig = {
    database: {
        uri: process.env.DB_URI_LOCAL ?? 'mongodb://localhost/test_db'
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY,
        iv: parseInt(process.env.IV_LENGTH)
    },
    jwt: {
        user: {
            accessTokenSecret: process.env.USER_ACCESS_TOKEN_SECRET,
            accessTokenExpiresIn: process.env.USER_ACCESS_TOKEN_EXPIRES_IN,
            refreshTokenSecret: process.env.USER_REFRESH_TOKEN_SECRET,
            refreshTokenExpiresIn: process.env.USER_REFRESH_TOKEN_EXPIRES_IN
        },
        admin: {
            accessTokenSecret: process.env.ADMIN_ACCESS_TOKEN_SECRET,
            accessTokenExpiresIn: process.env.ADMIN_ACCESS_TOKEN_EXPIRES_IN,
            refreshTokenSecret: process.env.ADMIN_REFRESH_TOKEN_SECRET,
            refreshTokenExpiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN
        }
    },
    GCP : {
        client_id : process.env.GCP_CLIENT_ID
    },
    redis: {
        url: process.env.REDIS_CLOUD_URL
    },
    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
}

envConfig.jwt.super_admin = envConfig.jwt.admin;


export default envConfig;