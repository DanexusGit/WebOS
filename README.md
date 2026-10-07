# WebOS
Abra `index.html` no navegador. PC ve a area de trabalho; celular/tablet ve a interface estilo iOS (automatico).

    index.html            estrutura da pagina
    css/styles.css        tema e interface do PC
    css/mobile.css        interface do celular (iOS)
    css/perf.css          otimizacoes de desempenho
    css/input.css         campos de texto sempre editaveis
    css/aero.css          visual Frutiger Aero / Windows 7 (tema padrao)
    css/store.css         layout da Game Store (estilo Steam)
    js/core/input.js      digitacao: foco e teclado (iOS/Android)
    js/core/kernel.js     armazenamento, sistema de arquivos, sons, boot, login
    js/core/windows.js    gerenciador de janelas e dialogos
    js/core/perf.js       deteccao de aparelho fraco
    js/apps/system-apps.js   Arquivos, Editor, Terminal, Biblioteca de jogos
    js/apps/media-apps.js    Musica, Calculadora, Calendario, Relogio, Paint...
    js/apps/browser-settings.js  Navegador, Configuracoes, Notas, Games
    js/apps/aero.js       icones, apps removidos, menu Iniciar Win7, papeis de parede
    js/apps/store.js      Game Store: catalogo gn-math (alternativa: UGS), instalar/jogar
    js/apps/extras.js     Unity, login estilo Windows 10, menus de botao direito, mais apps
    js/shell/desktop.js   barra de tarefas, icones, menu iniciar
    js/shell/mobile.js    tela inicial, bloqueio, central de controle (iOS)
    games/geochat.js      arquivo "Games" embutido (carrega ao abrir)
    games/unity.js        arquivo "Unity" embutido (carrega ao abrir)

    assets/icons/         icones do sistema (PNG com transparencia)
    assets/wallpapers/    26 papeis de parede (wpNN.jpg) + thumbs/ para a grade; registrados em WALLPAPER_FILES (js/apps/aero.js)
    assets/login/win7.jpg  fundo da tela de login/bloqueio
    assets/ui/             logo do Windows (Iniciar/boot/login) e seta de login
    assets/avatars/        fotos de perfil (SVG): user, guest, fish, flower, leaf, bubble
    js/shell/xbox.js       dashboard estilo Xbox 360 (Metro): abas, tiles, avatar, Guide, controle
    css/xbox.css           visual do dashboard Xbox 360
