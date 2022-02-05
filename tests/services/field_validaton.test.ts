import FieldValidationService from '../../app/common/services/field_validation/field.validation.service'

describe('FieldValidationService', () => {
  const valid_passwords: Array<string> = ['gY@3Cwl4FmLlQ@HycAf', 'New_passw0rd!', '4 M ! v kkkkkkkkk', '4 M v ! kkkkkkkkk', '4 v ! M kkkkkkkkk']
  const invalid_passwords: Array<Array<string>> = [
    ['BCDFGH1JKL3MNOP!', 'No lowercase character'],
    ['bcd3fgh1jklmnop!', 'No uppercase character'],
    ['bcdfgh1jklmnop!', 'No digit'],
    ['BCDFGH1JKL3mnop', 'No special character'],
    ['9!fD', 'Not long enough'],
  ]

  describe.each(valid_passwords)(`should validate valid password`, (password) => {
    it(`${password}`, () => {
      expect(FieldValidationService.isValidPassword(password)).toBeTruthy()
    })
  })

  describe.each(invalid_passwords)(`should not validate invalid password`, (password, reason) => {
    it(`${reason}: ${password}`, () => {
      expect(FieldValidationService.isValidPassword(password)).toBeFalsy()
    })
  })
})
