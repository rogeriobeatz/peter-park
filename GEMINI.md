# PeterPark - Documentação de Contexto

Este arquivo contém o estado atual e a visão técnica do projeto para auxiliar no desenvolvimento contínuo.

## 📋 Visão Geral
PeterPark é uma plataforma web de mini-jogos educativos e recreativos, focada em interatividade, animações e feedback sonoro.

## 🛠️ Stack Tecnológica
- **Frontend:** React (TypeScript)
- **Build Tool:** Vite
- **Estilização:** CSS Modules
- **PWA:** Configurado para instalação como aplicativo nativo.

## 🕹️ Arquitetura de Jogos
A aplicação possui um hub central (`Park.tsx`) que gerencia o acesso a diversos mini-jogos:

### Jogos Principais
- **PeterRun (`src/games/PeterRun/`):** Jogo de corrida/plataforma com lógica complexa, sistema de player e ambiente dinâmico.
- **BubblePop:** Jogo de estourar bolhas.
- **MemoryGame:** Jogo da memória clássico.
- **WhackGame:** Estilo "acerte a toupeira".
- **FeedingGame:** Interação de alimentação de personagens.

### Atividades Educativas/Criativas
- **MassinhaGame:** Atividade de modelagem criativa.
- **MusicGame:** Exploração sonora e musical.
- **NumbersGame:** Aprendizado de numerais.
- **ShapesGame:** Reconhecimento de formas geométricas.

## 🎨 Ativos e Multimídia
- **Sprites de Personagem:** Localizados em `public/sprites/rabbit/`, contendo animações completas (Idle, Run, Jump, Attack, Dead).
- **Trilha Sonora:** Gerenciada pelo componente `BackgroundMusic.tsx`, com arquivos MP3 em `public/music/`.

## 📁 Estrutura de Pastas Chave
- `src/games/`: Jogos com lógica mais complexa e isolada.
- `src/views/`: Componentes que representam as telas dos mini-jogos.
- `src/components/`: Componentes reutilizáveis (Card, Música, etc).
- `public/sprites/`: Ativos de animação (PNG Sheets e GIFs).
