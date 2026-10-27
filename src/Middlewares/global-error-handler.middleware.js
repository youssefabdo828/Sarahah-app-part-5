const globalErrorHandler = (err, req, res, next) => {
    console.error(err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code;

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }

    res.status(statusCode).json({
        message,
        errorbody: err.data,
        code
    });
};

export default globalErrorHandler;