import bcrypt from "bcryptjs";

const createPasswordHash = async (password: string): Promise<string> => {

    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(password, salt);

    return hash;
};

export default createPasswordHash;