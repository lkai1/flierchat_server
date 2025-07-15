import bcrypt from "bcryptjs"

const createPasswordHash = async (password) => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

export default createPasswordHash