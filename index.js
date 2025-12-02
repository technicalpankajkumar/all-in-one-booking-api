import { app } from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { registerUploadFolder } from "./utils/multer.js";

process.on("uncaughtException", (err) => {
    console.log(`Error ${err.message}`);
    console.log('shutdown server due to unhandled uncaugth exceoption')
  });
registerUploadFolder(app);
connectToDatabase()

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
    console.log(` Error ${err.message}`);
    console.log("sutdown the server due to unhandled promise rejection");
    server.close(() => {
      process.exit(1);
    });
  });