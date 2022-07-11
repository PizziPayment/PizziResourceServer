import FieldValidationService from '../../app/common/services/field_validation/field.validation.service'

describe('FieldValidationService', () => {
  const valid_passwords: Array<string> = [
    'gY@3Cwl4FmLlQ@HycAf',
    'New_passw0rd!',
    '4 M ! v kkkkkkkkk',
    '4 M v ! kkkkkkkkk',
    '4 v ! M kkkkkkkkk',
    '!@#$%^&*()/|\\-_?.,;+¤{}[]aA0',
  ]
  const invalid_passwords: Array<[string, string]> = [
    ['BCDFGH1JKL3MNOP!', 'No lowercase character'],
    ['bcd3fgh1jklmnop!', 'No uppercase character'],
    ['bcdfgh1jklmnop!', 'No digit'],
    ['BCDFGH1JKL3mnop', 'No special character'],
    ['9!fD', 'Not long enough'],
  ]
  const valid_sirets: Array<string> = [
    '56208290901190',
    '03877701700013',
    '03877705800017',
    '03877707400014',
    '03877710800010',
    '03877711600013',
    '03877712400017',
    '03877713200010',
    '03877714000013',
    '03877715700017',
    '03877716500010',
    '03877717300014',
    '03877718100017',
    '03877719900019',
    '03877720700010',
    '03877721500013',
    '03877722300017',
    '03877723100010',
    '03877724900012',
    '03877725600017',
    '03877726400011',
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

  describe.each(valid_sirets)('should validate valid sirets', (siret) => {
    it(`${siret}`, () => {
      expect(FieldValidationService.isValidSiret(siret)).toBeTruthy()
    })
  })
})
