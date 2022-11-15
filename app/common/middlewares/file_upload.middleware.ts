import * as multer from 'multer'

export const file_upload = multer({ storage: multer.memoryStorage() })
