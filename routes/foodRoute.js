import express from 'express'
import {addFood,listFood,removeFood} from "../controllers/foodController.js"
import multer from "multer"

const foodRouter = express.Router();

//image storage engine

const storage = multer.diskStorage({
  destination: "uploads", 
  filename:(req,file,cb)=>{
    return cb(null,`${Date.now()}${file.originalname}`)
  }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed!"));
      }
      cb(null, true);
    },
  });
  
  foodRouter.post("/add", upload.single("image"), async (req, res, next) => {
    try {
      await addFood(req, res);
    } catch (error) {
      next(error);
    }
  });
  
  foodRouter.get("/list", async (req, res, next) => {
    try {
      await listFood(req, res);
    } catch (error) {
      next(error);
    }
  });

  foodRouter.post("/remove",removeFood);
  



export default foodRouter;