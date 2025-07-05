import { Request, Response, NextFunction } from 'express';
import { getSingleFilePath, IFolderName } from '../../shared/getFilePath';

const parseFileData = (fieldName: IFolderName) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use dynamic fieldName to get the file path
      const filePath = getSingleFilePath(req.files, fieldName);

      // Handle additional data if present
      if (req.body.data) {
        const data = JSON.parse(req.body.data);
        req.body = { [fieldName]: filePath, ...data };
      } else {
        req.body = { [fieldName]: filePath };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default parseFileData;
