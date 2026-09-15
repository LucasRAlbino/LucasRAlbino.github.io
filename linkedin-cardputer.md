# Post LinkedIn: Cardputer ADV como multi-tool de RF (CC1101 + nRF24L01+)

**Write-up de origem:** `writeups/cardputer-cc1101-nrf24.html`
**Link (vai só no primeiro comentário):** https://lucasralbino.github.io/writeups/cardputer-cc1101-nrf24.html
**Repositório:** https://github.com/LucasRAlbino/The-Hacking-Lab (pasta `Hardware Hacking/Cardputer-CC1101-nRF24`)
**Público-alvo:** recrutadores e profissionais de segurança ofensiva, pessoal de hardware/embarcados, entusiastas de RF/IoT.
**Tom:** técnico, direto, sem hype. Um projeto de bancada, não um "gadget de hacker".

**Imagem:** `assets/img/cardputer/circuito-linkedin.jpg` (4:5, 1080x1350): a foto do circuito com o
analisador de espectro na tela. É o visual principal do post.

---

## Formato recomendado: post de imagem única

A foto do circuito já é forte e cabe sozinha. Post de imagem única, com a legenda abaixo e o link
no primeiro comentário. Se preferir carrossel, há um esqueleto de 5 slides no fim deste arquivo.

---

# Legenda do post

Peguei um M5Stack Cardputer ADV e transformei numa base de bancada para estudar RF.

A ideia: dois rádios de pesquisa num aparelho de bolso, com teclado e tela, sem depender de um SDR
preso ao notebook.

- **CC1101** para sub-GHz (433 / 868 / 915 MHz), a faixa dos controles, sensores e telemetria barata.
- **nRF24L01+ PA/LNA** para 2,4 GHz, com análise de atividade no espectro (é o que aparece na tela).

Os dois dividem o mesmo barramento SPI, cada um com seu chip-select, chaveados por software: sem
jumper e sem reset, é só endereçar um ou outro.

O detalhe que evita queimar a placa: o ESP32-S3 não tolera 5 V em nenhum GPIO. Então os 5 V do
conector EXT passam por um conversor DC-DC buck-boost (V987 Mini) e os dois rádios recebem
somente 3,3 V.

E o pulo do gato no firmware: o Bruce, no build padrão do Cardputer, aponta os dois rádios para os
mesmos pinos. Sem remapear o `brucePins.conf`, eles não funcionam ligados ao mesmo tempo. Ajustado
o mapeamento, sub-GHz e 2,4 GHz convivem no mesmo barramento.

Para que serve: análise de espectro em 2,4 GHz, estudo de protocolos sub-GHz, pesquisa de segurança
de RF e IoT, e CTFs de hardware.

Projeto de pesquisa e estudo, em equipamento próprio, para testes em ambientes autorizados e uso
acadêmico.

Escrevi o passo a passo, com a pinagem, a alimentação, o remapeamento do Bruce e o esquemático
completo para quem quiser montar. Link no primeiro comentário.

#HardwareHacking #RF #ESP32 #Cardputer #Bruce #IoTSecurity #SDR #SubGHz #RedTeam #Cibersegurança

---

# Primeiro comentário

Write-up completo, com pinagem, alimentação, o `brucePins.conf` e o esquemático para montar:
https://lucasralbino.github.io/writeups/cardputer-cc1101-nrf24.html

Esquemático e notas também no repositório:
https://github.com/LucasRAlbino/The-Hacking-Lab/tree/main/Hardware%20Hacking/Cardputer-CC1101-nRF24

Créditos e referências:
• M5Stack Cardputer-Adv: documentação oficial
• pingequalab/cardputer-adv-cc1101-nrf24-auto-switch (MIT / CC BY-SA 4.0): mapeamento em SPI compartilhado
• BruceDevices/firmware: firmware e wiki

---

## Notas de publicação

- **Link só no primeiro comentário**: a legenda não leva URL, para não penalizar o alcance.
  Comente logo após publicar e fixe o comentário.
- **Melhor janela:** terça a quinta, 8h–10h (BRT).
- A foto já mostra o espectro na tela; não precisa de mais nada, mas se quiser reforçar o
  "funcionando de verdade", vale um segundo slide com a tela em close.

---

## Alternativa: carrossel de 5 slides (4:5)

Mesmo visual do portfólio: fundo escuro, fonte mono, acento vermelho.

**Slide 1: Capa (usar a foto `circuito-linkedin.jpg`)**
Título: `Um Cardputer virou minha bancada de RF de bolso.`
Rodapé: `Hardware · RF: write-up nos comentários`

**Slide 2: O que tem dentro**
Dois rádios numa placa perfurada:
CC1101 (sub-GHz 433/868/915 MHz) + nRF24L01+ PA/LNA (2,4 GHz), no mesmo SPI, chaveados por software.

**Slide 3: O detalhe que não pode errar**
O ESP32-S3 não tolera 5 V em nenhum GPIO.
5 V do EXT → buck-boost V987 Mini → 3,3 V. Os rádios recebem só 3,3 V.

**Slide 4: O pulo do gato no firmware**
O Bruce aponta os dois rádios para os mesmos pinos por padrão.
Remapeei o `brucePins.conf` (CC1101 cs=13/io0=5, nRF24 cs=6/io0=4) e os dois passam a conviver.

**Slide 5: Para que serve**
Análise de espectro 2,4 GHz, estudo de protocolos sub-GHz, pesquisa de RF/IoT, CTFs de hardware.
Equipamento próprio, ambientes autorizados e uso acadêmico.
Rodapé: `Write-up completo no primeiro comentário ↓`
