// ==UserScript==
// @name       Extrator de dependencias
// @version    1.0.0.9
// @description  Coleta dados de históricos do sigeduca para ser analisado por uma planilha específica alunos com dependências de disciplinas escolares.
// @author       Roberson Arruda
// @match		  http://*.seduc.mt.gov.br/ged/hwmgedhistorico.aspx*
// @match		  https://*.seduc.mt.gov.br/ged/hwmgedhistorico.aspx*
// @homepage      https://github.com/robersonarruda/extratordep/blob/main/extratordep.user.js
// @downloadURL   https://github.com/robersonarruda/extratordep/raw/main/extratordep.user.js
// @updateURL     https://github.com/robersonarruda/extratordep/raw/main/extratordep.user.js
// @copyright  2024, Roberson Arruda (robersonarruda@outlook.com)
// ==/UserScript==


/*
* "Quando tudo está perdido,
* Sempre existe um caminho.
* Quando tudo está perdido,
* Sempre existe uma luz!" 
* (A Via Láctea - Legião Urbana)
*/

//CARREGA libJquery
var libJquery = document.createElement('script');
libJquery.src = 'https://code.jquery.com/jquery-3.4.0.min.js';
libJquery.language='javascript';
libJquery.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(libJquery);

//CSS DOS BOTÕES
var styleSCT = document.createElement('style');
styleSCT.type = 'text/css';
styleSCT.innerHTML =
    '.botaoSCT {'+
    '	-moz-box-shadow:inset 1px 1px 0px 0px #b2ced4;'+
    '	-webkit-box-shadow:inset 1px 1px 0px 0px #b2ced4;'+
    '	box-shadow:inset 1px 1px 0px 0px #b2ced4;'+
    '	background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #4e88ed), color-stop(1, #3255c7) );'+
    '	background:-moz-linear-gradient( center top, #4e88ed 5%, #3255c7 100% );'+
    '	filter:progid:DXImageTransform.Microsoft.gradient(startColorstr="#4e88ed", endColorstr="#3255c7");'+
    '	background-color:#4e88ed;'+
    '	-moz-border-radius:4px;'+
    '	-webkit-border-radius:4px;'+
    '	border-radius:4px;'+
    '	border:1px solid #102b4d;'+
    '	display:inline-block;'+
    '	color:#ffffff;'+
    '	font-family:Trebuchet MS;'+
    '	font-size:11px;'+
    '	font-weight:bold;'+
    '	padding:2px 0px;'+
    '	width:152px;'+
    '	text-decoration:none;'+
    '	text-shadow:1px 1px 0px #100d29;'+
    '}.botaoSCT:hover {'+
    '	background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #3255c7), color-stop(1, #4e88ed) );'+
    '	background:-moz-linear-gradient( center top, #3255c7 5%, #4e88ed 100% );'+
    '	filter:progid:DXImageTransform.Microsoft.gradient(startColorstr="#3255c7", endColorstr="#4e88ed");'+
    '	background-color:#3255c7;'+
    '}.botaoSCT:active {'+
    '	position:relative;'+
    '	top:1px;}'+
    '.menuSCT{'+
    '	-moz-border-radius:4px;'+
    '	-webkit-border-radius:4px;'+
    '	border-radius:4px;'+
    '	border:1px solid #102b4d;}'
document.getElementsByTagName('head')[0].appendChild(styleSCT);

//Dados de metadados do script
const scriptName = GM_info.script.name; // Obtém o valor de @name
const scriptVersion = GM_info.script.version; // Obtém o valor de @version

//Variáveis
var situacao;
var sithist;
var histdep = 0;
var vetAluno = [];
var lin = 0;
var col = 1;
var n = 0;
var j = 0;
var a = "";
var codhist = [];
var zero = "0";
var linha = 1;
var linhaarea = 1;
var linhadisc = 1;
var tentativa = 1;
var gravar = 0;
var posrec = 0;
var cadastro = [];
var historicos = [];
var alunoatual;
var finalizado = 0;
var finalarea = 0;
var finaldisc = 0;
var numano;
var anosprog = [" "];
var na;
var link = "http://sigeduca.seduc.mt.gov.br/ged/hwtgedhistoricoescolar.aspx?";
var area = "span_vGEDHISTAREADSCG_00";
var sitarea = "span_vGEDHISTAREASITAPRG_00";
var disciplina = "span_vGEDHISTDISCNOM_00";
var sitdisciplina = "span_vGEDHISTDISCSITAPRG_00";
var serie = "span_vGEDSERIEDSCCPL";
var seriehist;

//FUNÇÃO SALVAR CONTEÚDO EM CSV
function saveTextAsFile() {
    var conteudo = document.getElementById("txtDados").value; //P Retirar acentos utilize =>> .normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    var a = document.createElement('a');
    a.href = 'data:text/csv;base64,' + btoa(conteudo);
    a.download = 'dadosHistoricoGED.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
}

//FUNÇÃO COPIAR CONTEÚDO DO TXTAREA
function copiar(){
    txtareaDados.select();
    document.execCommand("copy");
}

//Resetar variáveis
var restvar = function(){
     vetAluno = [];
     lin = 0;
     col = 1;
     n = 0;
     a = "";
     codhist = [];
     zero = "0";
     linha = 1;
     linhaarea = 1;
     linhadisc = 1;
     tentativa = 1;
     cadastro = [];
     historicos = [];
     alunoatual;
     finalizado = 0;
     finalarea = 0;
     finaldisc = 0;
     posrec = 0;
}

function extrairAno(texto) {
    // Primeiro, verificar se é FUNDAMENTAL e não contém MÉDIO
    if (texto.includes("FUNDAMENTAL") && !texto.includes("MÉDIO")) {
        // Regex para encontrar o último número seguido de º ou ° (como "4º")
        const regexUltimoNumero = /(\d)[º°]/g;
        const resultadoUltimoNumero = [...texto.matchAll(regexUltimoNumero)].pop();

        // Se encontrou um número no padrão "4º"
        if (resultadoUltimoNumero) {
            // Retornar como "4º ANO DO FUNDAMENTAL"
            return `${resultadoUltimoNumero[0].replace(/°/, 'º')} ANO DO FUNDAMENTAL`;
        }
    }

    // Se não for FUNDAMENTAL, procurar por "Xº ANO"
    const regexAno = /[1-3][º°]\s?ANO/gi;
    const resultadoAno = texto.match(regexAno);

    // Se encontrou "Xº ANO", normalize-o
    if (resultadoAno) {
        return resultadoAno[0].replace(/°/, 'º').replace(/\s/g, '');
    }

    // Retorna null se nenhum dos padrões foi encontrado
    return null;
}

//Coletar códigos do hitórico
function coletcodhist(aluno){
    tentativa = 0;
    na = 0;
    linha = 1;
    zero = "0";
    finalizado = 0;
    codhist = [];
    numano = "";
    anosprog = [];
    gravar = 0;
    document.getElementById('gx_ajax_notification').style.display = "contents";
    document.getElementById('vGEDALUCOD').value = aluno;
    document.getElementsByName('BUTTONCONSULTAR')[0].click();
    var executar = setInterval(()=>{
        if(tentativa < 600){
            if(document.getElementById('gx_ajax_notification').style.display == 'none'){
                if(document.getElementById('span_vGRIDGEDALUCOD_0001') !== null){
                    alunoatual = document.getElementById('span_vGRIDGEDALUCOD_0001').innerHTML;
                    alunoatual = alunoatual.replace(/ /g,"");
                }else{alunoatual = 0}

                if(alunoatual == aluno){
                    codhist[0] = aluno;
                    do{
                        if(document.getElementById('span_vGRIDGEDALUCOD_00'+zero+linha.toString()) !== null){
                            numano = document.getElementById('span_vGRIDGEDSERIEDSCCPL_00'+zero+linha.toString()).innerHTML;
                            numano = numano.split("&gt;");
                            numano = numano[numano.length-1];
                            histdep = 0;
                            j = 0;
                            do{
                                if(numano == anosprog[j]){histdep = 1}
                                j++;
                            }while(j<anosprog.length)
                                situacao = document.getElementById('span_vGRIDGEDHISTSITAPR_00'+zero+linha.toString()).innerHTML;
                            if(situacao == "Em Progressão" || situacao == "Progressão Parcial" || histdep == 1){
                                codhist[na+1] = document.getElementById('span_vGRIDGEDHISTCOD_00'+zero+linha.toString()).innerHTML;
                                codhist[na+1] = codhist[na+1].replace(/ /g,"");
                                anosprog[na] = numano;
                                gravar = 1;
                                na++;
                            }
                            linha++;
                            if(linha > 9){zero="";}
                        }
                        else{
                            linha = 30;
                            clearInterval(executar);
                            if(gravar == 1){cadastro[posrec] = codhist; posrec++;}
                            finalizado = 1;
                        }
                    } while(linha < 30)
                }
                else{
                    clearInterval(executar);
                    var con = confirm('Falha ao carregar histórico do aluno, aluno sem histórico ou código do aluno ('+
                                      aluno +') inválido! Pular para o próximo?');
                    if(con == true){finalizado = 1;}
                    else{finalizado = 2}
                 }
            }
            else{
                tentativa++;
            }
        }
        else{
            clearInterval(executar);
            alert('Falha: tempo esgotado! Tente novamente!');
            finalizado = 2;
        }
    },100)
}

function coletar(){
    restvar();
    txtareaDados.value ="";
    vetAluno = txtareaAluno.value.match(/[0-9]+/g).filter(Boolean);

    coletcodhist(vetAluno[n]);
    var iniciar = setInterval(()=>{
        if(n < vetAluno.length-1){
            if(finalizado == 1){
                n++;
                coletcodhist(vetAluno[n]);
            }
            else if(finalizado == 2){clearInterval(iniciar);}
        }
        else{
            if(finalizado == 1){
                clearInterval(iniciar);
                ifrIframe1.addEventListener("load", coletaDados);
                ifrIframe1.src= link+cadastro[lin][col]+","+cadastro[lin][0]+",HWMGedHistorico,,UPD,N";
            }
            else if(finalizado == 2){clearInterval(iniciar);}
        }
    },500);
}

function coletaDados(){
    //reseta variáveis
    a = "";
    finalarea = 0;
    zero = "0";
    finaldisc = 0;
    linhaarea = 1;
    linhadisc = 1;
    setTimeout(()=>{
        if(cadastro[lin].length >= 1){
            do{
                if(parent.frames[0].document.getElementById(area+zero+linhaarea.toString()) !== null){
                    finaldisc = 0;
                    a = a + cadastro[lin][0]; //Cod Aluno
                    a = a + ";"+parent.frames[0].document.getElementById('span_vGEDALUNOM').innerHTML.replace(" - ", "");
                    sithist = parent.frames[0].document.getElementById('vGEDHISTSITAPR');
                    a = a +";"+sithist.options[sithist.selectedIndex].text;
                    seriehist = parent.frames[0].document.getElementById(serie).innerHTML; //Texto contendo "...ENSINO MÉDIO > REGULAR > ... > 1º ANO > 10º" etc
                    seriehist = extrairAno(seriehist); // Extrai apenas a série "1ºANO,2ºANO,etc".

                    //seriehist = seriehist.split("&gt;"); //método anterior, substituído pelo acima, devido mudança na nomenclatura do novo ensino médio.
                    //seriehist = seriehist[seriehist.length-1].replace(/ /g,"");

                    a = a + ";" +seriehist;
                    a = a + ";AREA: "+parent.frames[0].document.getElementById(area+zero+linhaarea.toString()).innerHTML; //Área do conhecimento
                    a = a + "-"+parent.frames[0].document.getElementById(sitarea+zero+linhaarea.toString()).innerHTML +";"; //Situação área do conhecimento
                    do{
                        if(parent.frames[0].document.getElementById(disciplina+zero+linhadisc.toString()+'00'+zero+linhaarea.toString()) !== null){
                            a = a +parent.frames[0].document.getElementById(disciplina+zero+linhadisc.toString()+'00'+zero+linhaarea.toString()).innerHTML; //Disciplina
                            a = a + "-"+parent.frames[0].document.getElementById(sitdisciplina+zero+linhadisc.toString()+'00'+zero+linhaarea.toString()).innerHTML+";"; //Situação da Disciplina
                            linhadisc++;
                            if(linhadisc > 9){zero="";};
                        }
                        else {
                            a = a+"\n";
                            finaldisc = 1;
                            linhaarea++;
                            if(linhaarea > 9){zero="";};
                            linhadisc = 1;
                        }
                    }while(finaldisc == 0)
                }
                else{
                    finalarea = 1;
                    a = a.replace(/&gt;/g,">")
                    historicos[col-1] = a;
                    txtareaDados.value = txtareaDados.value+a+"\n";
                    col++;
                    if(col < cadastro[lin].length){
                        ifrIframe1.src = link+cadastro[lin][col]+","+cadastro[lin][0]+",HWMGedHistorico,,UPD,N";
                    }
                    else if(lin < cadastro.length-1){
                        historicos[lin] = historicos;
                        lin++;
                        col=1;
                        ifrIframe1.src = link+cadastro[lin][col]+","+cadastro[lin][0]+",HWMGedHistorico,,UPD,N";
                    }
                    else{
                        alert('finalizado!');
                        copiar();
                    }
                }
            }while(finalarea == 0)

        }
        else{
                alert('Falha: nenhum código de aluno válido. Tente novamente!');
        }
    },500)
}

//BOTÃO EXIBIR ou ESCONDER
var exibir = '$("#credito1").slideToggle();if(this.value=="ESCONDER"){this.value="EXIBIR"}else{this.value="ESCONDER"}';
var btnExibir = document.createElement('input');
btnExibir.setAttribute('type','button');
btnExibir.setAttribute('id','exibir1');
btnExibir.setAttribute('value','ESCONDER');
btnExibir.setAttribute('class','menuSCT');
btnExibir.setAttribute('style','background:#FF3300; width: 187px; border: 1px solid rgb(0, 0, 0); position: fixed; z-index: 2002; bottom: 0px; right: 30px;');
btnExibir.setAttribute('onmouseover', 'this.style.backgroundColor = "#FF7A00"');
btnExibir.setAttribute('onmouseout', 'this.style.backgroundColor = "#FF3300"');
btnExibir.setAttribute('onmousedown', 'this.style.backgroundColor = "#EB8038"');
btnExibir.setAttribute('onmouseup', 'this.style.backgroundColor = "#FF7A00"');
btnExibir.setAttribute('onclick', exibir);
document.getElementsByTagName('body')[0].appendChild(btnExibir);

//DIV principal (corpo)
var divCredit = document.createElement('div');
divCredit.setAttribute('id','credito1');
divCredit.setAttribute('name','credito2');
divCredit.setAttribute('class','menuSCT');
divCredit.setAttribute('style','background: #7bccc6; color: #000; width: 290px; height: 300px; text-align: center;font-weight: bold;position: fixed;z-index: 2002;padding: 5px 0px 0px 5px;bottom: 24px;right: 30px');
document.getElementsByTagName('body')[0].appendChild(divCredit);

//Iframe
var ifrIframe1 = document.createElement("iframe");
ifrIframe1.setAttribute("id","iframe1");
//ifrIframe1.setAttribute("src","about:blank");
ifrIframe1.setAttribute("style","height: 100px; width: 255px; display:none");
divCredit.appendChild(ifrIframe1);

//TEXTO CÓDIGO ALUNO
var textCodAluno = document.createTextNode("INFORME OS CÓDIGOS DOS ALUNOS");
divCredit.appendChild(textCodAluno);

var quebraLinha = document.createElement("br");
divCredit.appendChild(quebraLinha);

//textarea alunos a serem pesquisados
var txtareaAluno = document.createElement('TEXTAREA');
txtareaAluno.setAttribute('name','txtAluno');
txtareaAluno.setAttribute('id','txtAluno');
txtareaAluno.setAttribute('value','');
txtareaAluno.setAttribute('style','border:1px solid #000000;width: 235px;height: 60px; resize: none');
divCredit.appendChild(txtareaAluno);

quebraLinha = document.createElement("br")
divCredit.appendChild(quebraLinha);

//BOTÃO COLETAR
var btnColetar = document.createElement('input');
btnColetar.setAttribute('type','button');
btnColetar.setAttribute('name','btnColetar');
btnColetar.setAttribute('value','coletar');
btnColetar.setAttribute('class','botaoSCT');
divCredit.appendChild(btnColetar);
btnColetar.onclick = coletar;

//QUEBRA LINHA
quebraLinha = document.createElement("br");
divCredit.appendChild(quebraLinha);
quebraLinha = document.createElement("br")
divCredit.appendChild(quebraLinha);

//TEXTO DADOS COLETADOS
var textColetados = document.createTextNode("DADOS COLETADOS");
divCredit.appendChild(textColetados);

quebraLinha = document.createElement("br")
divCredit.appendChild(quebraLinha);

//textarea pra dados coletados
var txtareaDados = document.createElement('TEXTAREA');
txtareaDados.setAttribute('name','txtDados');
txtareaDados.setAttribute('id','txtDados');
txtareaDados.setAttribute('value','');
txtareaDados.setAttribute('style','border:1px solid #000000;width: 260px;height: 95px; resize: none; background: #bebad0');
txtareaDados.readOnly = true;
txtareaDados.onclick = copiar;
divCredit.appendChild(txtareaDados);

quebraLinha = document.createElement("br")
divCredit.appendChild(quebraLinha);

//BOTAO SALVAR EM TXT
var btnCopiar = document.createElement('input');
btnCopiar.setAttribute('type','button');
btnCopiar.setAttribute('name','btnCopiar');
btnCopiar.setAttribute('value','copiar');
btnCopiar.setAttribute('class','botaoSCT');
divCredit.appendChild(btnCopiar);
btnCopiar.onclick = copiar;

//DIV CREDITO
var divCredito = document.createElement('div');
divCredit.appendChild(divCredito);

var br1 = document.createElement('br');
divCredito.appendChild(br1);

var span1 = document.createElement('span');
span1.innerHTML = '>>Roberson Arruda<<';
divCredito.appendChild(span1);

br1 = document.createElement('br');
span1.appendChild(br1);

span1 = document.createElement('span');
span1.innerHTML = '(robersonarruda@outlook.com)';
divCredito.appendChild(span1);

br1 = document.createElement('br');
span1.appendChild(br1);

span1 = document.createElement('span');
span1.textContent = `${scriptName} v${scriptVersion}`
divCredito.appendChild(span1);
