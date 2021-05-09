async function verifyCredential(username, password) {
    return !username && !password;
}

module.exports = {verifyCredential}