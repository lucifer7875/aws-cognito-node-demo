const express = require('express');
const router = express.Router();

const cognito = require('./cognito');

router.post('/signup', async (req, res) => {
    const { body } = req;
    console.log('7', body);

    let { email, name, password, phone_number } = body;

    try {
        let result = await cognito.signUp(name, email, password, phone_number);
        console.log("13", result);
        let response = {
            username: result.user.username,
            id: result.userSub,
            sucess: true
        }

        res.status(200).json({ 'result': response })
    } catch (err) {
        res.status(400).json({ 'error': err })
    }

})

router.post('/code', async (req, res) => {
    const { body } = req;

    if (body.user && body.code) {
        const { user, code } = body;

        try {
            console.log('35', user, code);
            let result = await cognito.verifyCode(user, code);
            res.status(200).json({ "result": result });
        } catch (err) {
            console.log(err);
            res.status(400).json({ "error": err });
        }
    } else {
        res.status(400).json({ "error": "bad format" });
    }
})

router.post('/login', async (req, res) => {
    const { body } = req;

    if (body.email && body.password) {
        let { email, password } = body;
        console.log("52", email, password);

        try {
            await cognito.logIn(email, password, (err, result) => {
                if (err) {
                    console.log("60", err);
                    res.status(400).json({ error: err });
                } else {
                    res.status(200).json({ result });
                }
            });
            // const result = await cognito.logIn(email, password);
            // res.status(200).json(result);
        } catch (err) {
            console.log("66", err);
            res.status(400).json({ error: err });
        }
    } else {
        res.status(400).json({ error: "bad request" });
    }
})

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (email) {
        try {
            let result = await cognito.forgotPassword(email);
            res.status(200).json({ "result": result });
        } catch (err) {
            console.log(err);
            res.status(400).json({ "error": err });
        }
    } else {
        res.status(400).json({ "error": "bad format" });
    }

});

router.post('/reset-password', async (req, res) => {
    const { email, newPassword, confirmationCode } = req.body;

    try {
        await cognito.resetPassword(email, newPassword, confirmationCode);
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(400).json({ error: err.message || 'Error resetting password' });
    }
});

router.post('/checkverificationCode', async (req, res) => {
    const { username, verificationCode } = req.body;

    try {
        const result = await cognito.checkVerificationCode(username, verificationCode);
        res.status(200).json({ message: 'Verification code is valid', result });
    } catch (err) {
        console.log('err', err);
        res.status(400).json({ error: 'Verification code is invalid', err });
    }
});

router.post('/changePassword', async (req, res) => {
    const { body } = req;

    if (body.email && body.oldPassword && body.newPassword) {
        const { email, oldPassword, newPassword } = body;

        try {
            await cognito.ChangePassword(email, oldPassword, newPassword, (err, result) => {
                if (err) {
                    res.status(400).json({ error: err });
                } else {
                    res.status(200).json({ result });
                }
            });
        } catch (err) {
            res.status(400).json({ "error": err });
        }
    } else {
        res.status(400).json({ "error": "bad format" });
    }
})


module.exports = router;