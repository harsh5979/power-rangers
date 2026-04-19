module.exports  = (req, res, next) => {
    try {
        const userType = req.sessionId;
        
        if (userType === 'admin') {
            return next();
        }
        else {
            throw new Error('You are not authorized to access this page');
        }

    } catch (error) {
        res.status(401).json({ message: error.message });

    }


}