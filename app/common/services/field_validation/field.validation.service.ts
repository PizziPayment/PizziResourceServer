export default class FieldValidationService {
    static isValidEmail(email: string): boolean {
        const rule =
            /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

        return rule.test(email)
    }

    static isValidPassword(password: string): boolean {
        const rule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/

        return rule.test(password)
    }

    static isValidPhone(phone: string): boolean {
        const rule = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/

        return rule.test(phone)
    }
}
