import app from './app';
import config, { dbConnect } from './config';

const start = async () => {
  try {
    await dbConnect();
    app.listen(config.PORT, () => {
      console.log(`Server running on http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
