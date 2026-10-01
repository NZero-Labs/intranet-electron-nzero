import { desktopCapturer, dialog, Session } from 'electron'
import { getBaseWindow } from '~/main/main-window'

/**
 * Habilita navigator.mediaDevices.getDisplayMedia() nas abas (usado pela assistência remota).
 * Sem este handler o Electron rejeita o pedido e a intranet entende como recusa do usuário.
 * Mostra um seletor: esta aba, tela inteira (por monitor) ou uma janela.
 */
export function initDisplayMediaHandler(ses: Session) {
  ses.setDisplayMediaRequestHandler(
    async (request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 0, height: 0 }
        })
        const screens = sources.filter((source) => source.id.startsWith('screen:'))
        const windows = sources.filter((source) => source.id.startsWith('window:'))

        const options = [
          { label: 'Esta aba (Intranet)', pick: () => callback({ video: request.frame }) },
          ...screens.map((source, index) => ({
            label: screens.length > 1 ? `Tela inteira ${index + 1}` : 'Tela inteira',
            pick: () => callback({ video: source })
          })),
          ...(windows.length > 0
            ? [{ label: 'Uma janela...', pick: () => pickWindow(windows, callback) }]
            : [])
        ]

        const { response } = await dialog.showMessageBox(getBaseWindow(), {
          type: 'question',
          title: 'Compartilhar tela',
          message: 'O que você deseja compartilhar com o suporte?',
          detail: 'Para o suporte poder controlar a intranet, escolha "Esta aba (Intranet)".',
          buttons: [...options.map((option) => option.label), 'Cancelar'],
          cancelId: options.length,
          noLink: true
        })

        if (response >= options.length) {
          callback({})
          return
        }
        await options[response].pick()
      } catch (error) {
        console.error('Erro ao compartilhar tela:', error)
        callback({})
      }
    },
    // macOS 15+: usa o seletor nativo do sistema quando disponível
    { useSystemPicker: true }
  )
}

async function pickWindow(
  windows: Electron.DesktopCapturerSource[],
  callback: (streams: Electron.Streams) => void
) {
  // ponytail: lista só as 15 primeiras janelas; um seletor com miniaturas se precisar de mais
  const listed = windows.slice(0, 15)
  const { response } = await dialog.showMessageBox(getBaseWindow(), {
    type: 'question',
    title: 'Compartilhar janela',
    message: 'Qual janela você deseja compartilhar?',
    buttons: [...listed.map((source) => source.name || 'Sem título'), 'Cancelar'],
    cancelId: listed.length,
    noLink: true
  })

  if (response >= listed.length) {
    callback({})
    return
  }
  callback({ video: listed[response] })
}
