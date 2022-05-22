import { siretLength } from '../../constants'

export default class FieldValidationService {
  static isValidEmail(email: string): boolean {
    const rule = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

    return rule.test(email)
  }

  static isValidPassword(password: string): boolean {
    const rule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*_?&])[A-Za-z\d \t@$!%_*?&]{12,}$/

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
      const digits = [...str.slice(0, -1)].reverse()
      const validator = Number(str[str.length - 1])
      const multipliers = [2, 1]

      for (const [i, c] of digits.entries()) {
        const digits = String(Number(c) * multipliers[i % 2])

        for (const n of digits) {
          sum += Number(n)
        }
      }

      sum = 10 - (sum % 10)

      return sum == validator
    }

    return rule.test(siret) && checksum(siret)
  }
}
