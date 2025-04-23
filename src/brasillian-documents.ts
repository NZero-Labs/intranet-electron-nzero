type formatCNPJCPFProps = (document: string) => {
  document: string
  isValid: boolean
  type: "cpf" | "cnpj"
  cleanup: string
}
export const formatCNPJCPF: formatCNPJCPFProps = (document: string) => {
  let type: "cpf" | "cnpj" = "cpf"
  let isValid = false
  document = document.replace(/[^\d]/g, "")
  if (document.length <= 11) {
    document = document.replace(/(\d{3})(\d)/, "$1.$2")
    document = document.replace(/(\d{3})(\d)/, "$1.$2")
    document = document.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    isValid = validateCPF(document.replace(/[^\d]/g, ""))
  } else {
    if (document.length > 14) {
      document = document.substring(0, 14)
    }
    document = document.replace(/(\d{2})(\d)/, "$1.$2")
    document = document.replace(/(\d{3})(\d)/, "$1.$2")
    document = document.replace(/(\d{3})(\d)/, "$1/$2")
    document = document.replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    type = "cnpj"
    isValid = validateCNPJ(document.replace(/[^\d]/g, ""))
  }
  return {
    cleanup: document.replace(/[^\d]/g, ""),
    document,
    isValid,
    type,
  }
}

export function validateCPF(cpf: string) {
  let Soma = 0
  let Resto

  const strCPF = String(cpf).replace(/[^\d]/g, "")

  if (strCPF.length !== 11) return false

  if (
    [
      "00000000000",
      "11111111111",
      "22222222222",
      "33333333333",
      "44444444444",
      "55555555555",
      "66666666666",
      "77777777777",
      "88888888888",
      "99999999999",
    ].indexOf(strCPF) !== -1
  )
    return false

  for (let i = 1; i <= 9; i++)
    Soma = Soma + parseInt(strCPF.substring(i - 1, i), 10) * (11 - i)

  Resto = (Soma * 10) % 11

  if (Resto == 10 || Resto == 11) Resto = 0

  if (Resto != parseInt(strCPF.substring(9, 10), 10)) return false

  Soma = 0

  for (let i = 1; i <= 10; i++)
    Soma = Soma + parseInt(strCPF.substring(i - 1, i), 10) * (12 - i)

  Resto = (Soma * 10) % 11

  if (Resto == 10 || Resto == 11) Resto = 0

  if (Resto != parseInt(strCPF.substring(10, 11), 10)) return false

  return true
}

export function validateCNPJ(cnpj: string) {
  const b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const c = String(cnpj).replace(/[^\d]/g, "")

  if (c.length !== 14) return false

  if (/0{14}/.test(c)) return false

  let i = 0
  let n = 0
  for (i; i < 12; n += parseInt(c[i]) * b[++i], 10);
  if (parseInt(c[12], 10) !== ((n %= 11) < 2 ? 0 : 11 - n)) return false

  i = 0
  n = 0
  for (i; i <= 12; n += parseInt(c[i], 10) * b[i++]);
  if (parseInt(c[13], 10) !== ((n %= 11) < 2 ? 0 : 11 - n)) return false

  return true
}

export function formatCEP(cep: string) {
  return cep?.replace(/[^\d]/g, "")?.replace(/(\d{5})(\d{1,3})$/, "$1-$2")
}

export function validateCEP(cep: string) {
  return /^[0-9]{5}-[0-9]{3}$/.test(
    (cep || "")?.replace(/[^\d]/g, "")?.replace(/(\d{5})(\d{1,3})$/, "$1-$2")
  )
}

export function formatPhone(phone: string, removeSpace?: boolean) {
  if (phone.startsWith("55") && phone.length > 11) phone = phone.substring(2)
  if (phone.startsWith("+55")) phone = phone.substring(3)
  return phone
    ?.replace(/\D/g, "")
    .replace(
      /(\d{2})(\d?)(\d{4})(\d{4})|(\d{2})(\d{4})(\d{4})/,
      function (match, p1, p2, p3, p4, p5, p6, p7) {
        const prefix = p1 || p5
        const digit = p2 || ""
        const firstPart = p3 || p6
        const secondPart = p4 || p7

        return `+55 (${prefix}) ${digit}${
          removeSpace ? "" : " "
        }${firstPart}-${secondPart}`
      }
    )
}
export function validatePhone(phone: string) {
  return /\(?(?:(?:\+?55\)?\s*)?)?([0-9]{2,3}|0((x|[0-9]){2,3}[0-9]{2}))\)?\s*[0-9]{4,5}[- ]*[0-9]{4}\b/gm.test(
    formatPhone(phone || "", true)
  )
}
export function validateChaveNFe(chave: string, cnpj: string) {
  const sefazKeys = ["87958674000181"]
  // Remove caracteres não numéricos da chave e do CNPJ
  chave = chave.replace(/\D/g, "")
  cnpj = cnpj.replace(/\D/g, "")

  // Validação simples do CNPJ (apenas um placeholder, você pode usar uma validação mais completa)
  if (!validateCNPJ(cnpj)) {
    return "CNPJ de faturamento não é válido para triangulação"
  }

  // Verifica se a chave tem 44 dígitos
  if (chave.length !== 44 || !/^\d+$/.test(chave)) {
    return "Chave da NF-e não é válida"
  }

  // Extrai o CNPJ da chave (dígitos 7 a 20)
  const cnpjChave = chave.substring(6, 20)
  if (cnpjChave !== cnpj && !sefazKeys.includes(cnpjChave)) {
    return "CNPJ da NF-e não é compátivel com CNPJ de faturamento"
  }

  // Pega os primeiros 43 dígitos da chave (sem o dígito verificador)
  const chaveSemDV = chave.substring(0, 43)

  // Pega o dígito verificador informado
  const dvInformado = parseInt(chave[43], 10)

  // Multiplicadores para o cálculo do módulo 11
  const multiplicadores = [
    4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4,
    3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]
  let dvCalculado =
    multiplicadores
      .map((weight, i) => weight * Number(chaveSemDV[i]))
      .reduce((acc, curr) => acc + curr, 0) % 11

  dvCalculado = dvCalculado < 2 ? 0 : 11 - dvCalculado
  // if (dvCalculado === 0 && (dvInformado === 0 || dvInformado === 1)) return true
  // Retorna se o dígito verificador está correto
  return dvCalculado === dvInformado
}
