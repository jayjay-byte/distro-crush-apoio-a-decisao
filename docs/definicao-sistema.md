# Distro Crush: decisões do sistema

Sistema de Apoio à Decisão (SAD) que recomenda distribuições Linux.
Base teórica principal: CASTRO, J. D. *Introducing Linux Distros*. Apress, 2016 (Cap. 2, Figura 2-1).
Arquivo de dados: `ficha_distros_atualizada.xlsx` (abas `criterios_decisao`, `pesos`, `agrupamento`, `criterios`, `ficha_completa`).

---

## 1. Base de dados

- **34 distribuições**, escolhidas a partir do ranking de 6 meses do DistroWatch, com prioridade para as distros do livro.
- Os dados foram atualizados com fontes atuais, porque o livro é de 2016:
  - requisitos de RAM e disco: somente de sites oficiais;
  - demais campos: DistroWatch (páginas das distros e busca avançada).
- Requisito sem fonte oficial: o campo fica vazio, e a distro passa pela triagem com aviso.
- Campos com vários valores usam o separador `|`.
- Distros removidas:
  - ZimaOS: era a única da tarefa NAS. Fica como trabalho futuro.
  - Valor de ambiente `embarcado_movel`.

---

## 2. Variáveis do sistema (quadro teórico: 10 variáveis)

| # | Variável | Indicadores (colunas) | Modelo de decisão | Agrupamento |
|---|---|---|---|---|
| 1 | Propósito de uso | `proposito`, `tarefa_tipo` | Critério ponderado + regra de tarefa | Sim (`tarefa_tipo`) |
| 2 | Ambiente de execução | `ambiente` | Restrição | Sim |
| 3 | Requisitos de hardware | `ram_min_gb`, `disco_min_gb`, `arquitetura` | Restrição | Sim (RAM) |
| 4 | Usabilidade | `amigabilidade` (1 a 5) | Critério ponderado | Sim |
| 5 | Suporte | `suporte_comunidade`, `suporte_comercial` | Critério ponderado | Sim |
| 6 | Estabilidade | `modelo_lancamento` | Critério ponderado | Sim |
| 7 | Sistema de inicialização | `init` | Critério ponderado | Sim (usa systemd?) |
| 8 | Ambiente gráfico | `desktop_padrao`, `desktops` | Critério ponderado | Não |
| 9 | Gerenciador de pacotes | `gerenciador_pacotes` | Não (só informativo) | Sim |
| 10 | Família da distribuição | `familia` | Não | Sim |

- **Variável x indicador:** a variável é o conceito; o indicador é a coluna que o mede.
- **Gerenciador de pacotes:** saiu do modelo de decisão para respeitar o limite de 10 variáveis. Motivos: é o último critério da Figura 2-1, tem o menor peso (2%), a pergunta era opcional e, nos testes, só trocou a 4ª e a 5ª posição da persona P6.

---

## 3. Perguntas da tela de simulação

| # | Pergunta | Opções | Tipo |
|---|---|---|---|
| a | Propósito de uso | Uso geral / Tarefa específica: Jogos, Segurança, Hardware antigo | Critério + regra de tarefa |
| b | Em qual ambiente você vai usar? | Desktop / Servidor / Nuvem | Eliminatória |
| c | Memória RAM disponível | valor em GB | Eliminatória |
| d | Armazenamento disponível | valor em GB | Eliminatória |
| e | Arquitetura do processador | 64 bits (x86_64) / 32 bits (i686) / ARM | Eliminatória |
| f | Nível de experiência | Iniciante / Intermediário / Avançado | Critério |
| g | Que tipo de ajuda é importante para você? | Fórum oficial / Suporte pago / Sem preferência | Critério |
| h | Como você prefere receber atualizações? | Versão fixa / Rolling / Sem preferência | Critério |
| i | Sistema init (opcional) | systemd, SysV, OpenRC, runit etc. (valores da ficha) | Critério |
| j | Ambiente gráfico (opcional) | GNOME, KDE Plasma, Xfce, Cinnamon etc. | Critério |

Botões: **Atualizar recomendação** (análise what-if, antes de salvar) e **Salvar**.

---

## 4. Modelo de decisão (duas fases)

### 4.1 Fase 1: triagem eliminatória (satisficing / regra conjuntiva, Simon 1955)

A distro só segue para o cálculo se passar em **todas** as regras:

| Restrição | Regra |
|---|---|
| RAM | `ram_min_gb <= RAM informada`. Sem valor na ficha: passa com aviso |
| Disco | `disco_min_gb <= armazenamento informado`. Sem valor: passa com aviso |
| Arquitetura | a arquitetura escolhida está em `arquitetura` |
| Ambiente | o ambiente escolhido está em `ambiente`. Justificativa: livro, Cap. 2, uma das primeiras perguntas da seleção |
| Tarefa | distro com `proposito = tarefa` só passa se o usuário escolher a tarefa dela |

Mapeamento de tarefas:

| Tarefa na tela | `tarefa_tipo` |
|---|---|
| Jogos | `jogos` |
| Segurança | `seguranca_forense`, `anonimato`, `seguranca_embarcado` |
| Hardware antigo | `hardware_antigo` |

### 4.2 Fase 2: Índice de Aderência (IA), por soma ponderada (SAW / modelo de pontuação)

```
IA = Σ (peso_i × nota_i) / Σ (pesos dos critérios respondidos)      (0 a 1 → 0 a 100%)
```

- Critério respondido com "Sem preferência" ou deixado em branco: sai do numerador e do denominador, e os demais pesos são redistribuídos.
- O IA **não** é probabilidade de sucesso.

### 4.3 Pesos (ROC, Barron & Barrett 1996)

A ordem de importância segue a Figura 2-1 do livro. Fórmula: `w_k = (1/n) × Σ_{i=k..n} 1/i`, com n = 6.

| Ordem | Critério | Peso ROC | Pesos iguais (sensibilidade) |
|---|---|---|---|
| 1 | Propósito | 0,408 | 0,167 |
| 2 | Usabilidade | 0,242 | 0,167 |
| 3 | Suporte | 0,158 | 0,167 |
| 4 | Estabilidade | 0,103 | 0,167 |
| 5 | Init | 0,061 | 0,167 |
| 6 | Ambiente gráfico | 0,028 | 0,167 |
| | **Soma** | **1,000** | **1,000** |

### 4.4 Regras de nota (0 a 1)

| Critério | Regra |
|---|---|
| Propósito | Uso geral: distro de propósito geral = 1. Tarefa: distro cujo `tarefa_tipo` corresponde = 1; demais = 0 |
| Usabilidade | Tabela 4.5, conforme o nível de experiência |
| Suporte | Fórum: `suporte_comunidade` sim = 1, não = 0. Pago: `suporte_comercial` sim = 1, parcial = 0,5, não = 0. Os dois marcados: média |
| Estabilidade | Versão fixa: `padrao` ou `padrao\|rolling` = 1. Rolling: `rolling` ou `padrao\|rolling` = 1. Outro = 0 |
| Init | Init escolhido presente em `init` = 1; ausente = 0 |
| Ambiente gráfico | Em `desktop_padrao` = 1; só em `desktops` = 0,5; ausente = 0 |

### 4.5 Usabilidade por nível de experiência

`amigabilidade`: 1 = mais fácil, 5 = mais difícil (escala baseada no livro).

| Amigabilidade | Iniciante | Intermediário | Avançado |
|---|---|---|---|
| 1 | 1,00 | 0,75 | 1 |
| 2 | 0,75 | 1,00 | 1 |
| 3 | 0,50 | 1,00 | 1 |
| 4 | 0,25 | 0,50 | 1 |
| 5 | 0,00 | 0,25 | 1 |

### 4.6 Ordenação e desempate

- As distros são ordenadas por IA decrescente.
- Desempate, nesta ordem:
  1. menor `amigabilidade`;
  2. fórum oficial = sim;
  3. distro analisada no livro (`no_livro = sim`);
  4. menor `ram_min_gb`;
  5. ordem alfabética do nome (último recurso, só quando os 4 critérios empatam).

---

## 5. Agrupamento

### 5.1 Método

- **Distância de Gower** (Gower, 1971), porque as variáveis são mistas. K-means não se aplica a variáveis qualitativas. Cada tipo de variável é comparado assim:
  - nominal: 0 se igual, 1 se diferente;
  - listas: 1 − Jaccard;
  - ordinal/numérica: |a − b| / amplitude.
- **Agrupamento hierárquico aglomerativo com ligação média** (Kaufman & Rousseeuw, 1990).
- **Número de grupos:** entre 3 e 7, escolhido pela **silhueta** (Rousseeuw, 1987). Resultado: **k = 7**, silhueta 0,384. O k = 6 praticamente empata (0,3835), mas o k = 7 separa as minimalistas.
- **Validação:** K-Medoids (PAM) com a mesma distância chegou a k = 7, silhueta 0,385, índice de Rand ajustado 0,90 em relação ao hierárquico. A única diferença: o Debian vai para "Generalistas".
- **Variáveis usadas (10):** família, tarefa, ambiente, modelo de lançamento, pacotes, init (systemd), suporte comercial, fórum, amigabilidade, RAM.
- **Variáveis retiradas do agrupamento:**
  - `proposito`: redundante com `tarefa_tipo`;
  - `disco_min_gb`: redundante com RAM e com 8 valores ausentes;
  - `arquitetura`: pouca variação e já tratada na triagem.
- Figura: `dendrograma_distros.pdf`.

### 5.2 Grupos fixos (k = 7)

| Grupo | Distros | Qtde |
|---|---|---|
| Amigáveis base Ubuntu | Linux Mint, Pop!_OS, Zorin OS, Ubuntu, elementary OS, Lubuntu | 6 |
| Família Debian | MX Linux, Debian, Tails, Kali, Devuan, Parrot OS, HackerOS, antiX, Q4OS | 9 |
| Generalistas e corporativas | Fedora, openSUSE, NixOS, Mageia, AlmaLinux, Red Hat | 6 |
| Família Arch | CachyOS, Manjaro, Arch Linux, Garuda Linux | 4 |
| Independentes sem systemd | Void Linux, Alpine, Gentoo, Slackware | 4 |
| Jogos | SteamOS, Bazzite, Nobara | 3 |
| Minimalistas | Puppy Linux, Tiny Core Linux | 2 |

### 5.3 Regras de exibição dos grupos

- Os grupos são **fixos**: não mudam por simulação. O perfil define **quais aparecem** (triagem) e **em que ordem** (IA).
- Cada grupo tem no mínimo **2 distros**. Um grupo de 1 distro é tratado como outlier.
- Um grupo só é exibido se tiver **pelo menos 2 distros compatíveis**. Podem aparecer de 1 a 7 grupos.
- **IA do grupo** = média dos IA das distros compatíveis do grupo.
- Os grupos são ordenados por IA do grupo decrescente. Em empate, vem antes o grupo com a distro mais bem posicionada.
- Dentro do grupo, as distros seguem o IA e o desempate.
- **Distro isolada** (única compatível do seu grupo):
  - IA **maior** que o do 1º grupo: vai para **"Destaque fora dos grupos"**, acima dos grupos;
  - caso contrário: vai para **"Também compatíveis"**, abaixo dos grupos.
  - nenhum grupo exibido: todas as isoladas vão para **"Destaque fora dos grupos"**, junto com o aviso de restrições abaixo.
- Menos de 3 grupos exibidos (mínimo da faixa 3–7 do agrupamento): exibir o aviso *"Suas restrições de hardware/ambiente limitaram as opções."* Ex.: P7 (2 grupos) exibe o aviso; P6 (3 grupos) não.
- O agrupamento deve ser recalculado sempre que a base mudar (inclusão ou remoção de distros, dados alterados).

---

## 6. Exibição do IA

| Onde | Formato |
|---|---|
| Resultado, Dashboard, Relatórios | % inteiro + barra + rótulo |
| Detalhamento da distro | valor exato (1 casa decimal) + contribuição por critério |

| Rótulo | Faixa (valor exato) |
|---|---|
| Muito alta | ≥ 90% |
| Alta | 75% a 89% |
| Média | 50% a 74% |
| Baixa | < 50% |

Texto de apoio: *"Quanto a distro atende às suas respostas, não é chance de sucesso."*

---

## 7. Telas

| Tela | Conteúdo |
|---|---|
| **Login** | Sem alterações |
| **Dashboard principal** | Simulações salvas: data, perfil resumido, 1º grupo e IA do grupo, distro de maior IA. Gráfico de pesos com 6 critérios (opcional) |
| **Módulo de simulação** | Formulário (seção 3) + botões "Atualizar recomendação" e "Salvar" |
| **Resultado** | Destaque fora dos grupos (se houver) → grupos nomeados com IA do grupo → distros com IA → Também compatíveis (se houver) → avisos |
| **Detalhamento da distro** | IA exato, grupo, tabela peso × nota × contribuição (6 critérios), "onde perdeu pontos" em linguagem simples, informações técnicas (pacotes, init, modelo) |
| **Relatórios** | Histórico/comparação de simulações com grupos nomeados e IA |

**Onde perdeu pontos:** lista os critérios respondidos com nota < 1, na ordem de importância, no formato "Critério (valor da distro)", para todos os critérios:

- Propósito: "Propósito (geral)" ou "Propósito (tarefa jogos)";
- Usabilidade: "Usabilidade (nota 2)", com o valor de `amigabilidade`;
- Suporte: "Suporte (fórum: não)", "Suporte (pago: parcial)". Com as duas opções marcadas, as que perderam pontos aparecem juntas: "Suporte (fórum: não; pago: parcial)";
- Estabilidade: "Estabilidade (rolling)";
- Init: "Init (OpenRC)";
- Ambiente gráfico: "Ambiente gráfico (padrão GNOME)"; quando a ficha não define padrão ("nenhum (escolha livre)"): "Ambiente gráfico (sem padrão, escolha livre)".

**Avisos por distro**, com acentuação correta e sem duplicatas:

- requisito não informado pelo projeto: gerado quando `ram_min_gb` ou `disco_min_gb` está ausente ("RAM: requisito não informado pelo projeto", "Armazenamento: requisito não informado pelo projeto");
- valor apenas recomendado: gerado quando `req_tipo_ram` ou `req_tipo_disco` = `recomendado` ("RAM: valor apenas recomendado", "Armazenamento: valor apenas recomendado");
- sistema live (Tails) e hardware restrito (SteamOS): vêm da coluna `aviso`. Da coluna, entram só os trechos que não são de requisito, porque esses já são gerados pelos campos acima.

### 7.1 Dados das telas (API do piloto)

- **Acesso:** login simples com usuário e senha (hash bcrypt) e token com validade de 8 horas. Cada usuário vê **só as próprias simulações**; a simulação de outro usuário é tratada como inexistente. Usuários de demonstração: `demo` e `demo2`.
- **Atualizar recomendação** (what-if) calcula sem salvar e não entra em nenhuma contagem. **Salvar** grava as respostas e o resultado completo (snapshot), para que o Relatório e o Detalhamento de simulações antigas não sejam recalculados.
- **Perfil resumido** de uma simulação: "Nível · Propósito · Ambiente", ex.: "Iniciante · Uso geral · Desktop".
- **Distro de maior IA** de uma simulação: a 1ª colocada geral do ranking, esteja ela num grupo, nos destaques ou em "também compatíveis".
- **Dashboard** (sumarização, só simulações do usuário logado; os filtros ficam só no visual):
  - total de simulações salvas, quantas no mês atual e a data da última;
  - IA do 1º grupo da última simulação;
  - distros mais recomendadas: quantas vezes cada distro foi a de maior IA;
  - simulações por propósito: Uso geral, Jogos, Segurança e Hardware antigo, mesmo com zero;
  - linha com o IA do 1º grupo de cada simulação, da mais antiga para a mais recente;
  - resumo da última simulação: data, perfil, RAM, 1º grupo com suas distros e IA, distro de maior IA.
- **Relatórios:** listagem paginada, da mais recente para a mais antiga. A **sensibilidade** (ROC × pesos iguais) é recalculada com as respostas salvas e a base atual, nos dois lados, para comparar nas mesmas condições.
- Datas gravadas em UTC e trocadas com o front-end em ISO 8601.

---

## 8. Validação: personas

| ID | Perfil | 1º grupo (ROC) | 1º grupo (pesos iguais) | Avaliação |
|---|---|---|---|---|
| P1 | Iniciante, uso geral (persona da tela) | Amigáveis base Ubuntu, 92% | igual | Atende |
| P2 | Avançado, rolling | Família Arch, 99% | igual | Atende |
| P3 | Jogos, intermediário | Jogos, 81% | igual | Atende (Garuda aparece na Família Arch) |
| P4 | Segurança, avançado | Família Debian, 73% (Kali, Parrot) | igual | Atende |
| P5 | Hardware antigo, iniciante | Minimalistas, 87% | igual | Atende |
| P6 | Servidor corporativo | Generalistas e corporativas, 82% | igual | Atende (3 grupos) |
| P7 | PC 32 bits, hardware antigo | Família Debian, 45% + destaque Tiny Core (72%) | igual | Atende à regra de isoladas |

Exemplo da tela (P1). Respostas: uso geral, desktop, fórum, iniciante, 8 GB, 128 GB, x86_64, versão fixa, Xfce, systemd.

1. Amigáveis base Ubuntu, 92%: Mint 100%, Zorin 100%, Ubuntu 97%, Lubuntu 97%, elementary 81%, Pop!_OS 75%
2. Família Debian, 83%: MX 94%, Debian 80%, Devuan 76%
3. Generalistas e corporativas, 83%: openSUSE 88%, Mageia 88%, Fedora 87%, Red Hat 79%, AlmaLinux 79%, NixOS 74%
4. Família Arch, 77%: Manjaro 84%, CachyOS 82%, Arch 64%
5. Independentes sem systemd, 53%: Slackware 59%, Gentoo 58%, Void 42%

---

## 9. Técnicas de análise empregadas

| Função | Técnicas |
|---|---|
| Sumarização | Contagem/frequência por categoria; média (IA do grupo); resumo das simulações |
| Agrupamento | Distância de Gower (Jaccard, amplitude); hierárquico aglomerativo com ligação média; silhueta; validação com K-Medoids (PAM) e índice de Rand ajustado |
| Classificação | Por regras: compatível/incompatível (triagem); faixas do IA; escala ordinal de amigabilidade; isolada/em grupo |
| Modelo de decisão | Soma ponderada (SAW); normalização 0–1; pesos ROC; ranking com desempate lexicográfico; análise what-if; análise de sensibilidade (pesos iguais); validação por personas |

Software: Python 3 (SciPy, scikit-learn, NumPy, openpyxl, matplotlib).

---

## 10. Referências

- BARRON, F. H.; BARRETT, B. E. Decision quality using ranked attribute weights. *Management Science*, v. 42, n. 11, p. 1515-1523, 1996.
- CASTRO, J. D. *Introducing Linux Distros*. Apress, 2016.
- EDWARDS, W.; BARRON, F. H. SMARTS and SMARTER. *Organizational Behavior and Human Decision Processes*, v. 60, n. 3, p. 306-325, 1994.
- GOWER, J. C. A general coefficient of similarity and some of its properties. *Biometrics*, v. 27, n. 4, p. 857-871, 1971.
- HUANG, Z. Extensions to the k-means algorithm for clustering large data sets with categorical values. *Data Mining and Knowledge Discovery*, v. 2, p. 283-304, 1998.
- KAUFMAN, L.; ROUSSEEUW, P. J. *Finding Groups in Data*. Wiley, 1990.
- KEENEY, R. L.; RAIFFA, H. *Decisions with Multiple Objectives*. Wiley, 1976.
- ROUSSEEUW, P. J. Silhouettes. *Journal of Computational and Applied Mathematics*, v. 20, p. 53-65, 1987.
- SIMON, H. A. A behavioral model of rational choice. *Quarterly Journal of Economics*, v. 69, n. 1, p. 99-118, 1955.
- Bibliografia da disciplina: Laudon & Laudon (2004); Stair & Reynolds (2005); O'Brien & Marakas (2013); Turban, McLean & Wetherbe (2004).
