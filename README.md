# CFG Estudos

App pessoal de preparação para a **CFG (Certificação ANBIMA de Fundamentos em Gestão)**.

- **3.589 questões com gabarito**: 3.007 do banco de exercícios (27 tópicos), 222 "mais caíram na prova" e 6 simulados completos de 60 questões.
- **Plano de estudos diário** gerado a partir da data da prova e do tempo disponível por dia:
  - Fase 1 (Base): teoria do tópico + questões do dia; revisão dos erros a cada 7 dias.
  - Fase 2 (Revisão): revisão por módulo, priorizando erros e as questões que mais caem.
  - Fase 3 (Simulados): os 6 simulados cronometrados (2h30) alternados com dias de correção; véspera leve.
  - Os dias de cada tópico são proporcionais ao peso oficial do módulo na prova.
- **Treino livre** (filtros por módulo, tópico, fonte, situação), **revisão de erros**, **simulado personalizado** na proporção oficial, **desempenho** por módulo vs. nota de corte (70%).
- **Conteúdo**: pontos-chave por tópico + objetivos oficiais das Orientações de Estudo da ANBIMA.
- Progresso salvo no navegador (localStorage), com backup/importação em Ajustes.

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em http://localhost:8080.

## Estrutura

- `public/data/questions.json` — questões (`src`: `b` banco, `t` mais caíram, `s` simulados; `ans` = índice da alternativa correta)
- `public/data/meta.json` — módulos e pesos, tópicos e objetivos oficiais
- `public/img/` — tabelas e gráficos que fazem parte de enunciados
- `src/lib/plan.ts` — gerador do plano de estudos
- `src/data/resumos.ts` — pontos-chave por tópico

## Observações sobre os dados

- Gabaritos extraídos das apostilas. Duas divergências encontradas entre apostilas estão sinalizadas na própria questão (códigos 504209 e 505614).
- Material de uso pessoal: mantenha o link do app privado.
