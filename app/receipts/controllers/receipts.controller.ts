import { Response, Request } from 'express';
import BasicReceipt from '../models/basic_receipt.model';
import Receipt from '../models/receipt.model';
import ReceiptsRequestModel from '../models/receipts.request.model';

const base_receipt = {
  vendor: {
    logo: 'https://store.steampowered.com/favicon.ico',
    name: 'Steam',
    address: {
      street: 'Rue',
      city: 'Ville',
      postalCode: 'Code postal',
    },
    siret: 'siret',
    shopNumber: '00 00 00 00 00'
  },
  paymentType: 'card',
  tvaPercentage: 20,
}

const receipts_array: Array<Receipt> = [
  {
    ...base_receipt,
    products: [{
      productName: 'Outer Wilds',
      quantity: 1,
      priceUnit: 17.4916,
      warranty: '18/06/2022',
      ecoTax: 0,
      discount: 0
    }],
    creationDate: '18/06/2020',
    totalHt: 17.4916,
    totalTtc: 20.99
  },
  {
    ...base_receipt,
    products: [{
      productName: 'Outer Wilds - Echoes of the Eye',
      quantity: 1,
      priceUnit: 10.4083,
      warranty: '28/09/2023',
      ecoTax: 0,
      discount: 0
    }],
    creationDate: '28/09/2021',
    totalHt: 10.4083,
    totalTtc: 12.49
  }
]

function toBasicReceipt(receipt: Receipt, index: number): BasicReceipt {
  return {
    receiptId: index,
    shopName: receipt.vendor.name,
    shopLogo: receipt.vendor.logo,
    date: receipt.creationDate,
    totalTtc: receipt.totalTtc
  }
}

export async function receipts(req: Request<unknown, unknown, ReceiptsRequestModel>, res: Response<unknown, Array<BasicReceipt>>): Promise<void> {
  res.status(200).send(Array.from(receipts_array, toBasicReceipt))
}

export async function receipt(req: Request<{ receipt_id: number }>, res: Response<unknown, Receipt>): Promise<void> {
  const id = req.params.receipt_id

  if (receipts_array[id]) {
    res.status(200).send(receipts_array[id])
  } else {
    res.status(404).send()
  }
}
