import { siretLength } from '../../constants'
import { PaymentMethod } from 'pizzi-db'

export default class FieldValidationService {
  static isValidEmail(email: string): boolean {
    const rule = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

    return rule.test(email)
  }

  static password_requirements = {
    lowercase: 'a-z',
    uppercase: 'A-Z',
    numbers: '0-9',
    symbols: '!@#$%^&*()\\/|\\\\\\-_?.,;+¤{}[\\]',
  }

  static isValidPassword(password: string): boolean {
    const { lowercase, uppercase, numbers, symbols } = FieldValidationService.password_requirements
    const rule = new RegExp(
      `^(?=.*[${lowercase}])(?=.*[${uppercase}])(?=.*[${numbers}])(?=.*[${symbols}])[${uppercase}${lowercase}${numbers} \\t${symbols}]{12,}$`,
    )

    return rule.test(password)
  }

  static isValidPhone(phone: string): boolean {
    const rule = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/

    return rule.test(phone)
  }

  static isValidSiret(siret: string): boolean {
    const rule = new RegExp(`^[0-9]{${siretLength}}$`)
    const checksum = (str: String) => {
      let sum = 0

      str = str.split('').reverse().join('')

      for (let i = 0; i < str.length; i++) {
        let n = Number(str[i])

        if (i % 2 !== 0) {
          n *= 2
        }

        n = (n % 10) + Math.floor(n / 10)

        sum += n
      }

      return sum % 10 == 0
    }

    return rule.test(siret) && checksum(siret)
  }

  static isValidPaymentMethod(method: string | PaymentMethod): boolean {
    return ['card', 'cash', 'unassigned'].includes(method)
  }
}
