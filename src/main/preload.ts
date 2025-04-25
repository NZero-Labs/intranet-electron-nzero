// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { electronAPI, type ElectronAPI } from '@electron-toolkit/preload'
import { validateCNPJ, validateCPF } from './brasillian-documents'
import { clipboard, ipcRenderer } from 'electron'

export interface ITabsAPI {
  new: (url?: string) => Promise<number>
  close: (id: number) => Promise<void>
  select: (id: number) => Promise<void>
  reorder: (tabIds: number[]) => Promise<void>
  getAllTabIds: () => Promise<number[]>
  getSelectedTabId: () => Promise<number>
}
export const tabsAPI: ITabsAPI = {
  new: (url?: string) => ipcRenderer.invoke('tabs:new', url),
  close: (id: number) => ipcRenderer.invoke('tabs:close', id),
  select: (id: number) => ipcRenderer.invoke('tabs:select', id),
  getAllTabIds: () => ipcRenderer.invoke('tabs:getAllTabIds'),
  getSelectedTabId: () => ipcRenderer.invoke('tabs:getSelectedTabId'),
  reorder: (tabIds: number[]) => ipcRenderer.invoke('tabs:reorder', tabIds)
}
declare global {
  interface Window {
    electron: ElectronAPI
    ipc: typeof ipcRenderer
    tabs: ITabsAPI
    isDarwin: boolean
  }
}
window.isDarwin = process.platform === 'darwin'
console.log("🚀 ~ window.addEventListener ~ process.platform:", process.platform)
window.addEventListener('DOMContentLoaded', () => {
  window.electron = electronAPI
  window.ipc = ipcRenderer
  window.tabs = tabsAPI
})
function getTableSelector(element: EventTarget) {
  // Percorre os elementos pai até encontrar a tabela mais próxima
  while (element && (element as HTMLElement).tagName !== 'TABLE') {
    element = (element as Node).parentNode
  }

  // Retorna o seletor da tabela ou null se não encontrar uma tabela
  return element
}

function tryToConvertStringToNumber(stringToConvert: string) {
  // Verifica se a string começa com o símbolo de moeda desejado
  const converter = (v: string) => {
    // Remove o símbolo de moeda e os pontos de separação de milhares
    const stringLimpa = v.replace(/[^\d,-]/g, '')

    // Substitui a vírgula por um ponto
    const stringPonto = stringLimpa.replace(',', '.')

    // Converte a string em número
    const numero = parseFloat(stringPonto)

    return numero.toString().replace('.', ',')
  }
  switch (true) {
    case stringToConvert?.startsWith('R$') || stringToConvert?.endsWith('KWP'):
      return converter(stringToConvert)
    case validateCPF(stringToConvert):
      return `=TEXTO("${stringToConvert}";"00000000000")`
    case validateCNPJ(stringToConvert):
      return `=TEXTO("${stringToConvert}";"00000000000000")`
    default:
      return `"${stringToConvert}"`
  }
}
function getCellText(cell: Node) {
  let cellText = ''

  // Função recursiva para percorrer os elementos dentro da célula
  const traverse = (element: Node) => {
    const tagName = (element as HTMLElement).tagName?.toLowerCase()
    if (element.nodeType === 3 || tagName === 'p') {
      // Se for um nó de texto
      cellText +=
        cellText === ''
          ? `${tryToConvertStringToNumber(element.textContent.trim() || ' ')}`
          : `\t${tryToConvertStringToNumber(element.textContent.trim() || ' ')}` // Adiciona o texto do nó de texto
    } else if (element.nodeType === 1) {
      // Se for um elemento HTML
      if (tagName === 'div' || tagName === 'p') {
        cellText += '\t' // Adiciona um espaço antes de elementos div
      }
      // Percorre os elementos filhos
      for (let i = 0; i < element.childNodes.length; i++) {
        traverse(element.childNodes[i])
      }
      if (element.childNodes.length === 0) {
        cellText += ' '
      }
      if (tagName === 'div' || tagName === 'p') {
        cellText += '\t' // Adiciona um espaço após elementos div
      }
    }
  }

  traverse(cell)

  return cellText.trim()
}
function getSelectedText(table: EventTarget) {
  let tableText = ''

  for (let i = 0; i < (table as HTMLTableElement).rows.length; i++) {
    const row = (table as HTMLTableElement).rows[i]
    for (let j = 0; j < row.cells.length; j++) {
      const cell = row.cells[j]
      const cellText = getCellText(cell)
      tableText += cellText + '\t' // Adiciona o texto da célula e uma tabulação
    }
    tableText += '\n' // Adiciona uma quebra de linha após cada linha da tabela
  }

  return tableText
}

window.addEventListener('contextmenu', (e) => {
  // e.preventDefault();
  const target = e.target
  const verifyTableElement = getTableSelector(target)
  if (verifyTableElement) {
    const range = document.createRange()
    range.selectNode(verifyTableElement as Node)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
    // document.execCommand("copy");
    clipboard.writeText(getSelectedText(verifyTableElement))
    window.getSelection().removeAllRanges()
  }
  switch ((target as HTMLElement).tagName) {
    case 'BUTTON':
    case 'A':
    case 'P':
    case 'SPAN':
    case 'DIV':
      ipcRenderer.send('rightClickApp', (target as HTMLElement).textContent.trim() ?? null)
      break
    case 'INPUT':
    case 'TEXTAREA':
    case 'SELECT':
      ipcRenderer.send('rightClickApp', (target as HTMLInputElement).value.trim() ?? null)
      break
    default:
      ipcRenderer.send('rightClickApp', null)
      break
  }
})

window.addEventListener('keypress', (e) => {
  switch (e.code) {
    case 'F5':
      ipcRenderer.send('reloadApp')
      break
    case 'KeyR':
      if (e.ctrlKey) ipcRenderer.send('reinicializeApp')
      break

    default:
      break
  }
})

window.addEventListener('keydown', async (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'w') {
    e.preventDefault()
  }
})

// window.addEventListener('auxclick', (event) => {
// event.preventDefault()
// if (event.button === 1 && event.target instanceof HTMLAnchorElement) {
//   const href = event.target.href
//   if (href) {
//     ipcRenderer.send('open-new-link', href)
//   }
// }
// })
