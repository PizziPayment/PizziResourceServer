import { TransactionState } from 'pizzi-db'
import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

export class TransactionStateQuery {
  static descriptor: ObjectDescriptor<Required<TransactionStateQuery>> = {
    state: { type: 'string', customValidator: withFieldValidator((value) => ['pending', 'validated', 'failed'].includes(value)) },
  }
  static validator: TypeValidator<Required<TransactionStateQuery>> = new TypeValidator(this.descriptor)

  state?: TransactionState
}
