#  FoodCity

Sistema web desenvolvido para conectar clientes e restaurantes em um ambiente interativo, permitindo realização de pedidos, gerenciamento de estoque e acompanhamento de métricas em tempo real.

---

##  Sobre o Projeto

O **FoodCity** é uma aplicação web que simula uma plataforma de delivery e gerenciamento de restaurantes.

O sistema foi desenvolvido para a disciplina de **Projeto de Programação**, aplicando conceitos de desenvolvimento web, persistência local de dados e comunicação entre páginas sem utilização de servidor externo.

---

## Demonstração Online

Acesse a versão hospedada do projeto:

 **FoodCity Cliente/ Painel:** [Clique aqui](https://projetofoodcity.netlify.app/foodcity/cliente/index.html)

---

##  Funcionalidades

###  Área do Cliente

- Visualização de restaurantes
- Consulta de cardápios
- Cadastro de clientes
- Realização de pedidos
- Navegação intuitiva e responsiva

###  Painel Administrativo

- Recebimento de pedidos em tempo real
- Gerenciamento de pedidos via Kanban
- Controle de estoque
- Histórico de pedidos
- Relatórios de desempenho
- Indicadores financeiros
- Comparação de métricas diárias
- Exportação de dados

---

##  Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- IndexedDB
- BroadcastChannel API
- LocalStorage

---

##  Estrutura do Projeto

```text
foodcity/
│
├── cliente/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── bridge.js
│   └── data.js
│
└── painel/
    ├── index.html
    ├── style.css
    ├── db.js
    ├── state.js
    ├── bridge.js
    ├── kanban.js
    ├── reports.js
    ├── render.js
    ├── stock.js
    ├── ui.js
    └── init.js
```

---

##  Comunicação entre Módulos

O sistema utiliza:

- BroadcastChannel
- LocalStorage
- IndexedDB

para compartilhar informações entre a área do cliente e o painel administrativo em tempo real, sem necessidade de backend.

---

##  Relatórios e Métricas

O painel administrativo oferece:

- Receita total
- Quantidade de pedidos
- Ticket médio
- Comparação com o dia anterior
- Comparação com a média dos últimos 30 dias
- Gráfico de faturamento dos últimos 7 dias

---

---

##  Equipe

- Joaquim Alfredo
- Kauã Vitor
- Lucas Portela
- Luna Gabrielly
- Maria Itauana
- Sidney Barros

---
