export default class FieldValidationService {
  static isValidEmail(email: string): boolean {
    const rule = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

    return rule.test(email)
  }

  static isValidPassword(password: string): boolean {
    let min_length = 12
    let min: boolean = false
    let maj: boolean = false
    let spe: boolean = false
    let digit: boolean = false

    for (const char of password) {
      let lower = char.toLowerCase()
      let upper = char.toUpperCase()

      min = (char != upper && char.toLowerCase() == lower) || min
      maj = (char != lower && char.toUpperCase() == upper) || maj
      spe = '!@#$%^&*'.includes(char) || spe
      digit = '0123456789'.includes(char) || digit

      if (min && maj && spe && digit) {
        return password.length >= min_length
      }
    }

    return min && maj && spe && digit && password.length >= min_length
  }

  static isValidPhone(phone: string): boolean {
    const rule = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/

    return rule.test(phone)
  }
}
