import db from './db.js';

const seeder = async (): Promise<void> => {
    await db.sequelize.sync()
        .catch(error => { console.error(error); });
};

export default seeder;
