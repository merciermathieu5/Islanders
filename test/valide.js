/* Harnais de validation — Sharks San Jose (jsdom) */
const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

let total = 0, echecs = 0;
function ok(cond, msg){
  total++;
  if (!cond){ echecs++; console.error('  ✗ ' + msg); }
}
function egal(a, b, msg){ ok(a===b, msg + ` (obtenu: ${JSON.stringify(a)}, attendu: ${JSON.stringify(b)})`); }
function proche(a, b, tol, msg){ ok(a!==null && a!==undefined && Math.abs(a-b)<=tol, msg + ` (obtenu: ${a}, attendu: ~${b})`); }
function tableauEgal(a, b, msg){ ok(JSON.stringify(a)===JSON.stringify(b), msg + ` (obtenu: ${JSON.stringify(a)}, attendu: ${JSON.stringify(b)})`); }

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

(async () => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://example.org/',
    pretendToBeVisual: true
  });
  // neutraliser fetch (aucun réseau pendant les tests)
  dom.window.fetch = () => Promise.reject(new Error('réseau désactivé en test'));
  await new Promise(r => setTimeout(r, 300));
  const W = dom.window;
  const S = W.__SJS__;

  console.log('— Chargement');
  ok(!!S, 'API de test exposée (__SJS__)');
  if (!S){ console.error('Arrêt.'); process.exit(1); }

  console.log('— Données de secours');
  egal(S.SECOURS_ROSTER.length, 22, '22 joueurs dans la formation de secours (20 patineurs + 2 gardiens, page du 28 juin — aucun backup)');
  const cros = S.SECOURS_ROSTER.find(j => j.nom === 'Sidney Crosby');
  egal(cros.salaire, 4750000, 'Salaire Crosby');
  egal(cros.ov, 84, 'Crosby OV 84 (à 38 ans, EX/LD 99/99)');
  const deb = S.SECOURS_ROSTER.find(j => j.nom === 'Alex DeBrincat');
  egal(deb.salaire, 9750000, 'Salaire DeBrincat (plus haut du club)');
  egal(deb.ov, 84, 'DeBrincat OV 84');
  egal(S.SECOURS_Y21.length, 20, '20 patineurs dans la référence Y21 (XtraStats, validés par ratios)');
  const crosY21 = S.SECOURS_Y21.find(x => x.nom === 'Sidney Crosby');
  egal(crosY21.pts, 92, 'Crosby 92 points en Y21 (meneur du club)');
  egal(crosY21.goals, 41, 'Crosby 41 buts en Y21');
  const seidY21 = S.SECOURS_Y21.find(x => x.nom === 'Moritz Seider');
  egal(seidY21.hits, 252, 'Seider 252 MEÉ en Y21');
  egal(S.SECOURS_Y21.filter(x=>x.gp>=80).length, 10, 'Dix patineurs à 80 matchs et plus (saison complète)');

  console.log('— Moteur de profils (tableaux 10-11-12) et matrices associées');
  const joueurDe = nom => S.SECOURS_ROSTER.find(j => j.nom === nom);
  const profilDe = nom => S.determinerProfil(joueurDe(nom));
  egal(profilDe('Sidney Crosby').profil, 'Elite', 'Crosby → Elite (38 ans)');
  tableauEgal(profilDe('Sidney Crosby').stats, ['shotpct','gwg','ppg','pts','pmrang'],
    'Stats évaluées Elite = tableau 20 (PCTG, GWG, PP, P, +/-)');
  egal(profilDe('Alex DeBrincat').profil, 'Elite', 'DeBrincat → Elite');
  egal(profilDe('Jack Hughes').profil, 'Prospect Elite', 'Hughes (24 ans) → Prospect Elite');
  egal(profilDe('Jack Hughes').mat, 'ELITE', 'Prospect Elite → même matrice ELITE');
  egal(profilDe('Seth Jarvis').profil, 'Prospect Elite', 'Jarvis (23 ans) → Prospect Elite');
  egal(profilDe('Ivan Demidov').profil, 'Junior Elite', 'Demidov (20 ans) → Junior Elite');
  egal(profilDe('Ryan Leonard').profil, 'Junior Elite', 'Leonard (20 ans) → Junior Elite');
  egal(profilDe('Elias Pettersson').profil, 'Playmaker', 'Pettersson → Playmaker');
  tableauEgal(profilDe('Elias Pettersson').stats, ['assists','pts'], 'Stats Playmaker = A, P');
  egal(profilDe('Nick Schmaltz').profil, 'Playmaker', 'Schmaltz → Playmaker');
  egal(profilDe('Jordan Kyrou').profil, 'Playmaker', 'Kyrou → Playmaker');
  egal(profilDe('Andrew Mangiapane').profil, 'Sniper', 'Mangiapane → Sniper');
  egal(profilDe('Nicolas Roy').profil, 'Power Forward', 'Roy → Power Forward');
  egal(profilDe('Lucas Feuk').profil, 'Prospect Power Forward', 'Feuk (24 ans) → Prospect Power Forward');
  egal(profilDe('Gabriel Vilardi').profil, 'Depth Forward', 'Vilardi → Depth Forward');
  tableauEgal(profilDe('Gabriel Vilardi').stats, ['mp'], 'Stats Depth Forward = MIN');
  egal(profilDe('Moritz Seider').profil, 'Prospect DEliteShutdown', 'Seider (24 ans) → Prospect DEliteShutdown');
  egal(profilDe('Kaiden Guhle').profil, 'Prospect DEliteShutdown', 'Guhle (23 ans) → Prospect DEliteShutdown');
  egal(profilDe('Connor Clifton').profil, 'DEliteShutdown', 'Clifton → DEliteShutdown');
  egal(profilDe('Drew Doughty').profil, 'DEliteShutdown', 'Doughty → DEliteShutdown (99 d\'expérience!)');
  egal(profilDe('Alexander Urbom').profil, 'DDefensive', 'Urbom → DDefensive (IT 95, ST 97)');
  tableauEgal(profilDe('Alexander Urbom').stats, ['pmrang','hits20','mg'], 'Stats DDefensive = +/- , MEÉ/20, MIN/M');
  egal(profilDe('Dmitry Kulikov').profil, 'DDefensive', 'Kulikov → DDefensive');
  egal(profilDe('Josh Manson').profil, 'DDefensive', 'Manson → DDefensive');
  egal(profilDe('Connor Hellebuyck').profil, 'Starter Goalie', 'Hellebuyck (OV 83) → Starter Goalie');
  tableauEgal(profilDe('Connor Hellebuyck').stats, ['hs','svpct','qggp','ming'], 'Stats Starter = HS, SV%, QG/GP, MIN');
  egal(profilDe('John Gibson').profil, 'Starter Goalie', 'Gibson (OV 80) → Starter Goalie (règle 6.2.5) — DEUX partants au club');

  console.log('— Matrices Y17 (article 6.2.6) : consultation par overall');
  egal(Object.keys(S.MATRICES).length, 15, '15 matrices de profils');
  const nbStats = Object.values(S.MATRICES).reduce((a,m)=>a+Object.keys(m).length,0);
  egal(nbStats, 40, '40 tableaux de seuils au total');
  tableauEgal(S.seuilsMatrice('ELITE','pts',82), [97,86,74,63,37,-1], 'Elite points OV 82');
  tableauEgal(S.seuilsMatrice('ELITE','pts',70), [23,20,17,15,9,-1], 'OV 70 ramené au rang 73');
  tableauEgal(S.seuilsMatrice('ELITE','pts',95), [117,104,90,77,45,-1], 'OV 95 ramené au rang 90');
  tableauEgal(S.seuilsMatrice('DELITEQB','ppg',80), [3,2,1,0,-1,-5], 'DElite QB buts en PP OV 80');
  tableauEgal(S.seuilsMatrice('STARTER','ming',85), [0.98,0.91,0.84,0.77,0.64,-1], 'Starter MIN (ratio) constant');
  tableauEgal(S.seuilsMatrice('BACKUP','psv',78), [908,899,890,881,872,-1], 'Backup Psv OV 78');
  tableauEgal(S.seuilsMatrice('GRINDER','hits20',77), [2.55,2.35,2.15,1.95,1.75,-1], 'Grinder MEÉ/20 OV 77');
  egal(S.seuilsMatrice('ELITE','inexistante',80), null, 'Statistique inconnue → null');

  console.log('— Statuts (tableau 18) : un degré exige de DÉPASSER STRICTEMENT son seuil');
  const sE82 = S.seuilsMatrice('ELITE','pts',82); // [97,86,74,63,37,-1]
  egal(S.statutSelonSeuils(97.5, sE82), 'memorable', '97,5 pts > 97 → Mémorable');
  egal(S.statutSelonSeuils(97,   sE82), 'excellente', '97 pts = seuil Mémorable → Excellente (pas de Mémorable sans dépasser)');
  egal(S.statutSelonSeuils(87,   sE82), 'excellente', '87 pts → Excellente');
  egal(S.statutSelonSeuils(75,   sE82), 'satisfaisante', '75 pts → Satisfaisante');
  egal(S.statutSelonSeuils(74,   sE82), 'correcte', '74 pts = seuil Satisfaisante → Correcte');
  egal(S.statutSelonSeuils(64,   sE82), 'correcte', '64 pts → Correcte');
  egal(S.statutSelonSeuils(38,   sE82), 'decevante', '38 pts → Décevante');
  egal(S.statutSelonSeuils(37,   sE82), 'oublier', '37 pts = seuil Décevante → À oublier');
  egal(S.statutSelonSeuils(null, sE82), 'indef', 'Valeur absente → à définir');
  egal(S.statutSelonSeuils(50, [60,null,null,null,null,null]), 'sousmemo', 'Seule cible Mémorable connue, non dépassée → sous le Mémorable');

  console.log('— Évaluation des totaux tels quels (aucune projection : facteur karma)');
  let ev = S.evaluerStat('pts', 98, sE82);
  egal(ev.valeur, 98, 'La valeur évaluée est le total courant, sans mise à l\'échelle');
  egal(ev.statut, 'memorable', '98 pts → Mémorable');
  egal(ev.mods, 60, 'ModS +60 pour un Mémorable');
  ev = S.evaluerStat('pts', 40, sE82);
  egal(ev.statut, 'decevante', '40 pts → Décevante');
  egal(ev.mods, -20, 'ModS -20 pour une Décevante');
  ev = S.evaluerStat('shotpct', 15.2, S.seuilsMatrice('ELITE','shotpct',82));
  egal(ev.statut, 'excellente', 'PCTG 15,2 sur seuils OV 82 → Excellente');
  ev = S.evaluerStat('pts', null, sE82);
  egal(ev.statut, 'indef', 'Sans valeur → à définir');

  console.log('— Statistiques dérivées');
  const prod = {gp:20, goals:10, shots:80, hits:60, mp:400, qs:8, svpct:0.905, pts:25};
  const jTest = {nom:'Test Joueur', po:'C'};
  proche(S.valeurStat(jTest, prod, 'shotpct'), 12.5, 1e-9, '%T = 10/80 = 12,5');
  proche(S.valeurStat(jTest, prod, 'hits20'), 3, 1e-9, 'MEÉ/20 = 60/(400/20) = 3');
  proche(S.valeurStat(jTest, prod, 'shots20'), 4, 1e-9, 'T/20 = 80/(400/20) = 4');
  proche(S.valeurStat(jTest, prod, 'mg'), 20, 1e-9, 'MIN/M = 400/20');
  proche(S.valeurStat(jTest, prod, 'qggp'), 0.4, 1e-9, 'DQ/M = 8/20');
  proche(S.valeurStat(jTest, prod, 'psv'), 905, 1e-9, 'Psv = %A × 1000');
  egal(S.valeurStat(jTest, prod, 'pts'), 25, 'Stat directe inchangée');
  const ctx = {limites: new Map([[S.normaliserNom('Test Joueur'), 62]])};
  proche(S.valeurStat(jTest, {gp:15}, 'ming', ctx), 15/62, 1e-9, 'MIN gardien = parties jouées / limite (ratio brut)');
  egal(S.valeurStat(jTest, {gp:15}, 'ming', {limites:new Map()}), null, 'Sans limite connue → à définir');

  console.log('— Rang du différentiel dans le club (tableau 20)');
  const rangs = S.calculerPmRangs([
    {nom:'Aa', gp:5, plusminus:5},
    {nom:'Bb', gp:5, plusminus:0},
    {nom:'Cc', gp:5, plusminus:-3},
    {nom:'Dd', gp:0, plusminus:9}   // exclu : aucun match
  ]);
  proche(rangs.get(S.normaliserNom('Aa'))?.prop, 1, 1e-9, 'Meilleur +/- → proportion 1,00');
  egal(rangs.get(S.normaliserNom('Aa'))?.rang, 1, 'Meilleur +/- → 1er rang');
  proche(rangs.get(S.normaliserNom('Bb'))?.prop, 0.5, 1e-9, 'Milieu → 0,50');
  egal(rangs.get(S.normaliserNom('Bb'))?.rang, 2, 'Milieu → 2e rang');
  proche(rangs.get(S.normaliserNom('Cc'))?.prop, 0, 1e-9, 'Dernier → 0,00');
  egal(rangs.get(S.normaliserNom('Cc'))?.total, 3, 'Classement sur 3 patineurs qualifiés');
  ok(!rangs.has(S.normaliserNom('Dd')), 'Joueur sans match exclu du classement');


  console.log('— Automatisation du rang +/- à l\'arrivée des statistiques (bout en bout)');
  {
    const ETAT2 = S.ETAT;
    const avantScoring2 = ETAT2.scoring, avantY212 = ETAT2.xtraEstY21;
    // dès que TeamScoring fournit des patineurs avec un différentiel, le rang se calcule seul
    const patineursRoster = S.SECOURS_ROSTER.filter(x9=>x9.po!=='G' && !x9.backup);
    const scoringFictif = patineursRoster.map((x9,i9)=>({
      nom:x9.nom, gp:10, goals:i9%4, assists:i9%5, pts:(i9%4)+(i9%5), shots:20+i9,
      pim:2, plusminus:(patineursRoster.length-1)/2 - i9, ppg:1, gwg:1
    }));
    ETAT2.scoring = {patineurs:scoringFictif, gardiens:[]};
    ETAT2.xtraEstY21 = true;
    const rangsAuto = S.calculerPmRangs(ETAT2.scoring.patineurs);
    egal(rangsAuto.size, patineursRoster.length, 'Tous les patineurs qualifiés sont classés automatiquement');
    const meilleur = patineursRoster[0];
    const rMeilleur = rangsAuto.get(S.normaliserNom(meilleur.nom));
    egal(rMeilleur?.rang, 1, 'Le meilleur différentiel du club obtient le 1er rang');
    proche(S.valeurStat(meilleur, {gp:10}, 'pmrang', {pmRangs:rangsAuto}), 1, 1e-9,
      'valeurStat lit la proportion de rang sans intervention');
    // un joueur évalué sur le rang +/- reçoit un statut réel dans l'interface re-rendue
    const jPm = ETAT2.roster.find(x9=>x9._profil?.stats?.includes('pmrang') && !x9.backup);
    ok(!!jPm, 'Au moins un joueur du club est évalué sur le rang +/-');
    if (jPm){
      W.document.querySelector('#progFiltres button[data-f="tous"]').click(); // force le re-rendu
      const carte = [...W.document.querySelectorAll('#progGrille .joueur-carte')]
        .find(c=>c.querySelector('.jc-nom').textContent===jPm.nom);
      ok(!!carte, 'Carte du joueur rendue avec la production fictive');
      const lignePm = [...(carte?.querySelectorAll('.stat-ligne')||[])]
        .find(l=>l.querySelector('.nom-stat').textContent.includes('Rang +/-'));
      ok(!!lignePm, 'Ligne «Rang +/- au club» présente');
      ok(lignePm && !lignePm.querySelector('.badge-etat.indef'), 'Le rang +/- reçoit un statut (plus «à définir»)');
      ok(lignePm && /ᵉ\/\d+/.test(lignePm.textContent), 'Rang ordinal affiché (ex. 4ᵉ/18)');
    }
    ETAT2.scoring = avantScoring2; ETAT2.xtraEstY21 = avantY212;
    W.document.querySelector('#progFiltres button[data-f="tous"]').click(); // retour à l'état initial
  }


  console.log('— Validation de l\'équipe des pages téléchargées (session des relais)');
  {
    const bonne = 'menu de la ligue… ' + S.CONFIG.equipe + ' 3-2-0 … table des joueurs';
    ok(S.validerPageEquipe(bonne), 'Page de la bonne équipe acceptée (sa fiche s\'y trouve)');
    ok(!S.validerPageEquipe('menu de la ligue… ZZAUTRE 11-8-0 … table des joueurs'),
       'Page d\'une autre équipe rejetée (fiche du club absente) — sera réessayée, jamais mise en cache');
    egal(S.extraireFiche(bonne), S.CONFIG.equipe + ' 3-2-0', 'Fiche extraite de la page validée');
  }

  console.log('— Modificateurs (tableaux 17 et 19) et fourchette de recote');
  egal(S.modA({po:'C', age:25}), 5, 'Patineur 25 ans → ModA +5');
  egal(S.modA({po:'C', age:35}), -25, 'Patineur 35 ans → ModA -25');
  egal(S.modA({po:'G', age:29}), 5, 'Gardien 29 ans → ModA +5');
  egal(S.modA({po:'G', age:33}), -10, 'Gardien 33 ans → ModA -10');
  egal(S.convertirJet(146), 3, 'Jet 146 → +3 (recote plafonnée à +3)');
  egal(S.convertirJet(200), 3, 'Aucun jet ne dépasse +3');
  egal(S.convertirJet(121), 2, 'Jet 121 → +2');
  egal(S.convertirJet(100), 0, 'Jet 100 → 0');
  egal(S.convertirJet(51), -1, 'Jet 51 → -1');
  egal(S.convertirJet(10), -4, 'Jet 10 → -4');
  egal(S.convertirJet(-25), -5, 'Jet -25 → -5');
  const four = S.fourchetteRecote({nom:'Cas type', po:'AD', age:30}, 10); // 30 ans → ModA-5 → base 65
  egal(four.base, 65, 'Base = 60 + ModA(-5) + ModS(10)');
  egal(four.min, -1, 'Pire jet (66) → -1');
  egal(four.max, 1, 'Meilleur jet (105) → +1');

  console.log('— Priorité des seuils : rangée personnalisée > Y17 ; surcharge = Mémorable seul');
  const jk = joueurDe('Jack Hughes');
  jk._profil = S.determinerProfil(jk);
  let s = S.seuilsPour(jk, 'pts', {}, {});
  tableauEgal(s.seuils, [97,86,74,63,37,-1], 'Seuils Y17 par défaut (Hughes, OV 83)');
  egal(s.source, 'Y17', 'Source = Y17');
  const perso = {ELITE: {pts: {83: [120,110,100,90,50,-1]}}};
  s = S.seuilsPour(jk, 'pts', perso, {});
  tableauEgal(s.seuils, [120,110,100,90,50,-1], 'La rangée personnalisée remplace Y17');
  egal(s.source, 'personnalisée', 'Source = personnalisée');
  s = S.seuilsPour(jk, 'pts', {}, {[S.normaliserNom(jk.nom)]: {pts: 120}});
  egal(s.seuils[0], 120, 'La surcharge fixe le seuil Mémorable');
  egal(s.seuils[2], 74, 'Les autres degrés restent ceux de la matrice');

  console.log('— Parseur de formation (fixture HTML réaliste)');
  const fixtureRoster = `<html><body><table>
    <tr><th>Nom</th><th>PO</th><th>HD</th><th>CD</th><th>IJ</th><th>IN</th><th>SP</th><th>ST</th><th>EN</th><th>DU</th><th>DI</th><th>SK</th><th>PA</th><th>PC</th><th>DF</th><th>OF</th><th>EX</th><th>LD</th><th>OV</th><th>Age</th><th>Salary</th><th>CT</th><th>HT</th><th>WT</th><th>Lien</th></tr>
    <tr><td>Jesperi Kotkaniemi</td><td>C</td><td>G</td><td>OK</td><td></td><td>70</td><td>83</td><td>77</td><td>89</td><td>86</td><td>83</td><td>83</td><td>83</td><td>79</td><td>62</td><td>79</td><td>61</td><td>51</td><td>82</td><td>25</td><td>7 250 000 $</td><td>3</td><td>6 ' 2</td><td>198 lbs</td><td>Lien</td></tr>
    <tr><td>Alexandar Georgiev</td><td>G</td><td>G</td><td>OK</td><td></td><td>83</td><td>87</td><td>81</td><td>85</td><td>87</td><td>85</td><td>88</td><td>73</td><td>80</td><td>NA</td><td>NA</td><td>83</td><td>74</td><td>80</td><td>29</td><td>3 000 000 $</td><td>1</td><td>6 ' 1</td><td>179 lbs</td><td>Lien</td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td>70</td><td>76</td><td>76</td><td>80</td><td>77</td><td>79</td><td>78</td><td>73</td><td>73</td><td>68</td><td>70</td><td>68</td><td>61</td><td>78</td><td>28</td><td>3 370 000 $</td><td>1,5</td><td>6 ' 1</td><td>195</td><td></td></tr>
  </table></body></html>`;
  const docR = new W.DOMParser().parseFromString(fixtureRoster, 'text/html');
  const joueurs = S.parseRoster(null, docR);
  egal(joueurs.length, 2, 'Deux joueurs extraits (rangée des moyennes ignorée)');
  egal(joueurs[0].nom, 'Jesperi Kotkaniemi', 'Nom du premier joueur');
  egal(joueurs[0].salaire, 7250000, 'Salaire converti (espaces et $)');
  egal(joueurs[0].sc, 79, 'Colonne OF lue comme SC');
  egal(joueurs[1].df, null, 'DF du gardien = NA → null');

  console.log('— Parseur de pointage (fixture)');
  const fixtureScoring = `<html><body><table>
    <tr><th>Name</th><th>GP</th><th>G</th><th>A</th><th>PTS</th><th>+/-</th><th>PIM</th><th>PP</th><th>GW</th><th>S</th><th>PCT</th></tr>
    <tr><td>Jaden Schwartz</td><td>10</td><td>4</td><td>8</td><td>12</td><td>5</td><td>2</td><td>2</td><td>1</td><td>25</td><td>16.0</td></tr>
  </table><table>
    <tr><th>Name</th><th>GP</th><th>W</th><th>L</th><th>T</th><th>AVG</th><th>SV%</th><th>SO</th><th>HS</th></tr>
    <tr><td>Alexandar Georgiev</td><td>6</td><td>4</td><td>2</td><td>0</td><td>2.31</td><td>0.915</td><td>1</td><td>2</td></tr>
  </table></body></html>`;
  const docS = new W.DOMParser().parseFromString(fixtureScoring, 'text/html');
  const sc = S.parseScoring(null, docS);
  egal(sc.patineurs.length, 1, 'Un patineur extrait');
  egal(sc.patineurs[0].pts, 12, 'Points de Schwartz');
  egal(sc.patineurs[0].plusminus, 5, 'Différentiel de Schwartz');
  egal(sc.gardiens.length, 1, 'Un gardien extrait');
  egal(sc.gardiens[0].w, 4, 'Victoires de Georgiev');
  ok(Math.abs(sc.gardiens[0].avg - 2.31) < 1e-9, 'Moyenne de Georgiev');
  egal(sc.gardiens[0].hs, 2, 'Colonne HS lue');

  console.log('— Parseur XtraStats (fixture texte)');
  const fixtureXtra = [
    '    Player                    Team            POS GP   G   A   P  Sh PiM   MP   H Sh/G',
    '    [Sidney Crosby](https://x/#Sidney Crosby) ISLANDERS          C   82  30  45  75 200  30 1700 100 2.44',
    '    [Pierre-Luc Dubois](https://x/#Pierre-Luc Dubois) ANAHEIM         C   76  30  38  68 199  23 1713 137 2.87',
    '    [* Backup_RW](https://x/#Backup_RW) ISLANDERS          LW   3   0   0   0   0   0    0   0 0.00'
  ].join('\n');
  const x = S.parseXtra(fixtureXtra, 'ISLANDERS');
  egal(x.length, 2, 'Deux patineurs ISLANDERS extraits (Anaheim exclu)');
  egal(x[0].hits, 100, 'MEÉ extraites depuis XtraStats');
  egal(x[0].mp, 1700, 'Minutes extraites depuis XtraStats');

  console.log('— Rendu de l\'interface');
  const doc = W.document;
  const rangees = doc.querySelectorAll('#tableAlignement tbody tr');
  egal(rangees.length, 22, '22 rangées dans la table d\'alignement');
  ok(doc.querySelector('#alignSommaire').textContent.includes('Masse salariale'), 'Sommaire de masse salariale rendu');
  ok(doc.querySelector('#ficheEquipe').textContent.includes('ISLANDERS'), 'Fiche d\'équipe affichée');
  const cartes = doc.querySelectorAll('#progGrille .joueur-carte');
  ok(cartes.length >= 18, 'Cartes de progression rendues (' + cartes.length + ')');
  ok(doc.querySelector('#progGrille').textContent.includes('ModS estimé'), 'ModA / ModS affichés sur les cartes');
  ok(doc.querySelectorAll('#progGrille .att-input').length > 0, 'Champs de cible Mémorable présents');
  const selMatrice = doc.querySelector('#selMatrice');
  egal(selMatrice.options.length, 15, 'Sélecteur des 15 matrices peuplé');
  ok(doc.querySelector('#selStat').options.length >= 1, 'Sélecteur de statistique peuplé');
  const rangeesMat = doc.querySelectorAll('#tableMatrice tbody tr');
  egal(rangeesMat.length, 18, 'Éditeur : rangées OV 73 à 90');
  egal(doc.querySelectorAll('#tableMatrice tbody input').length, 108, 'Éditeur : 18 rangées × 6 degrés');
  ok(doc.querySelector('#tableMatrice thead').textContent.includes('Mémorable'), 'Colonnes des degrés de satisfaction');
  ok(doc.querySelector('#sourcesTexte').textContent.includes('limites.json'), 'Source limites.json documentée');
  const boutonDiff = doc.querySelector('#progFiltres button[data-f="difficulte"]');
  ok(!!boutonDiff, 'Filtre «En difficulté» présent');

  console.log('— Masse salariale (cohérence)');
  const actifs = S.SECOURS_ROSTER.filter(x2 => !x2.backup);
  const comptabilises = actifs.filter(x2 => x2.ct > 0);
  const masse = comptabilises.reduce((s2, x2) => s2 + x2.salaire, 0);
  egal(masse, 83205000, 'Masse salariale des 22 pros = 83 205 000 $ (vérifiée contre la moyenne de la page : 3 782 045 $ × 22)');
  ok(!doc.querySelector('#alignSommaire .stat-carte').classList.contains('alerte'), 'Sous le plafond de 104 M$ : aucune alerte');
  ok(doc.querySelector('#alignSommaire .stat-carte .det').textContent.replace(/\s/g,'').includes('104000000'), 'Plafond affiché = 104 000 000 $');

  console.log('— Charte salariale des re-signatures (Y22, cap 104 M)');
  // Salaires minimums transcrits de la charte (en dollars)
  egal(S.salaireMinimum(74, 'RFA', 25), 700000, 'RFA OV74- = 700 000 $');
  egal(S.salaireMinimum(82, 'RFA', 25), 8750000, 'RFA OV82 = 8 750 000 $');
  egal(S.salaireMinimum(90, 'RFA', 22), 17500000, 'RFA OV87+ = 17 500 000 $ (clamp haut)');
  egal(S.salaireMinimum(80, 'UFA', 30), 5000000, 'UFA OV80 34- = 5 000 000 $');
  egal(S.salaireMinimum(80, 'UFA', 36), 3250000, 'UFA OV80 35+ = 3 250 000 $ (tranche d\'âge)');
  egal(S.salaireMinimum(83, 'UFAR2', 32), 7500000, 'UFA Ronde 2 OV83 34- = 7 500 000 $');
  egal(S.salaireMinimum(85, 'SANS', 37), 6000000, 'Sans contrat OV85 35+ = 6 000 000 $');
  egal(S.salaireMinimum(70, 'RFA', 25), 700000, 'OV sous 74 → clamp au plancher (700 000 $)');
  // Statut déduit de l'âge (règle retenue : 28- = RFA, sinon UFA)
  egal(S.statutResignature({age:28}), 'RFA', '28 ans → RFA');
  egal(S.statutResignature({age:29}), 'UFA', '29 ans → UFA');
  egal(S.statutResignature({age:22}), 'RFA', '22 ans → RFA');
  // Durées maximales par statut (charte)
  egal(S.dureeMaxCharte('RFA'), 7, 'RFA : durée max 7 ans');
  egal(S.dureeMaxCharte('UFA'), 4, 'UFA : durée max 4 ans');
  egal(S.dureeMaxCharte('UFAR2'), 2, 'UFA Ronde 2 : durée max 2 ans');
  egal(S.dureeMaxCharte('SANS'), 1, 'Sans contrat : durée 1 an');
  // Clé de charte avec tranche d'âge
  egal(S.cleCharte('UFA', 34), 'UFA_34', 'UFA 34 ans → colonne 34-');
  egal(S.cleCharte('UFA', 35), 'UFA_35', 'UFA 35 ans → colonne 35+');
  // Règle RFA : 1 à 7 saisons à la discrétion du DG, +1 échelon par année après 3
  egal(S.echelonEffectif(80, 'RFA', 3), 80, 'RFA 3 ans → échelon de base (OV 80)');
  egal(S.echelonEffectif(80, 'RFA', 4), 81, 'RFA 4 ans → échelon +1 (OV 81)');
  egal(S.echelonEffectif(80, 'RFA', 7), 84, 'RFA 7 ans → échelon +4 (OV 84)');
  egal(S.echelonEffectif(80, 'UFA', 4), 80, 'La règle d\'échelon ne touche pas les UFA');
  egal(S.salaireMinimum(80, 'RFA', 25, 1), 5750000, 'RFA OV80, 1 an = 5 750 000 $');
  egal(S.salaireMinimum(80, 'RFA', 25, 3), 5750000, 'RFA OV80, 3 ans = même minimum (5 750 000 $)');
  egal(S.salaireMinimum(80, 'RFA', 25, 4), 7500000, 'RFA OV80, 4 ans = échelon 81 (7 500 000 $)');
  egal(S.salaireMinimum(80, 'RFA', 25, 7), 12250000, 'RFA OV80, 7 ans = échelon 84 (12 250 000 $)');
  egal(S.salaireMinimum(86, 'RFA', 24, 7), 17500000, 'RFA OV86, 7 ans → échelon 90, clampé à 87+ (17 500 000 $)');
  egal(S.salaireMinimum(80, 'UFA', 30, 4), 5000000, 'UFA OV80, 4 ans = minimum inchangé (5 000 000 $)');
  // Format et parsing des montants
  egal(S.parseArgent('8,5 M'), 8500000, 'parseArgent «8,5 M» = 8 500 000');
  egal(S.parseArgent('900 k'), 900000, 'parseArgent «900 k» = 900 000');
  egal(S.parseArgent('7500000'), 7500000, 'parseArgent «7500000» = 7 500 000');
  egal(S.fmtArgentCourt(8500000), '8,5 M', 'fmtArgentCourt 8,5 M');
  egal(S.fmtArgentCourt(900000), '900 k', 'fmtArgentCourt 900 k');

  console.log('— Re-signature : interaction, persistance et impact sur la masse');
  console.log('— Fenêtre «Prolongation de contrat» : ouverture, bornage, impact, retrait');
  W.localStorage.removeItem('sjs_resignatures_v1');
  doc.querySelector('[data-vue="alignement"]')?.click();
  const btnP = doc.querySelector('button.btn-prolong[data-nom]');
  ok(!!btnP, 'Bouton «Prolonger» présent dans la colonne Contrat');
  egal(btnP.textContent.trim(), 'Prolonger', 'Libellé initial du bouton');
  const nomP = btnP.dataset.nom;
  const jP = S.ETAT.roster.find(x=>x.nom===nomP);
  const cleP = S.normaliserNom(nomP);
  const statutP = S.statutResignature(jP);
  const minP = S.salaireMinimum(jP.ov, statutP, jP.age);

  btnP.click();                                   // ouvre la fenêtre
  const modal = doc.getElementById('modalProlong');
  ok(!!modal && !modal.hidden, 'La fenêtre de prolongation s\'ouvre au clic');
  egal(doc.getElementById('mpNom').textContent, nomP, 'Nom du joueur affiché dans la fenêtre');
  egal(doc.getElementById('mpStatut').value, statutP, 'Statut proposé = statut déduit de l\'âge');
  const dureeInitP = statutP === 'RFA' ? 3 : S.dureeMaxCharte(statutP);
  const minPD = S.salaireMinimum(jP.ov, statutP, jP.age, dureeInitP);
  egal(+doc.getElementById('mpDuree').value, dureeInitP, 'Durée proposée : 3 ans pour un RFA (dernier palier sans hausse), durée max sinon');
  egal(S.parseArgent(doc.getElementById('mpSalaire').value), minPD, 'Salaire pré-rempli au minimum de la charte pour cette durée');
  egal(doc.getElementById('mpDuree').options.length, S.dureeMaxCharte(statutP),
    'Durées offertes = 1 à la durée max du statut');
  ok(doc.getElementById('mpImpact').textContent.includes('Masse projetée'), 'Aperçu d\'impact sur la masse affiché');
  ok(doc.getElementById('mpRetirer').style.display === 'none', 'Bouton «Retirer» masqué pour un joueur non prolongé');

  // un salaire sous le minimum est ramené au minimum à la confirmation
  doc.getElementById('mpSalaire').value = '1 M';
  doc.getElementById('mpOk').click();
  ok(modal.hidden, 'La fenêtre se ferme après confirmation');
  const rP = S.litResignatures();
  ok(!!rP[cleP], 'Prolongation persistée');
  egal(rP[cleP].salaire, minPD, 'Salaire sous le minimum ramené au minimum de la charte');
  egal(rP[cleP].statut, statutP, 'Statut enregistré');
  ok(rP[cleP].duree >= 1 && rP[cleP].duree <= S.dureeMaxCharte(statutP), 'Durée enregistrée dans les bornes de la charte');
  ok(doc.querySelector('#alignSommaire .det').textContent.includes('prolongé'), 'Mention «prolongé» dans le sommaire de masse');
  const btnP2 = [...doc.querySelectorAll('button.btn-prolong[data-nom]')].find(b=>b.dataset.nom===nomP);
  ok(btnP2.classList.contains('actif') && btnP2.textContent.includes('Prolongé'), 'Bouton passe à l\'état «Prolongé»');

  // la masse inclut le salaire de prolongation
  const masseAvecP = S.calculerMasse(S.litResignatures()).masse;
  const masseSansP = S.calculerMasse({}).masse;
  egal(masseAvecP - masseSansP, minPD - (jP.ct>0 ? jP.salaire : 0),
    'La masse remplace le salaire courant par celui de la prolongation');

  // hausse volontaire au-dessus du minimum
  btnP2.click();
  ok(doc.getElementById('mpRetirer').style.display !== 'none', 'Bouton «Retirer» visible pour un joueur prolongé');
  egal(doc.getElementById('mpOk').textContent, 'Mettre à jour', 'Bouton de confirmation devient «Mettre à jour»');
  const hausseP = minPD + 3000000;
  doc.getElementById('mpSalaire').value = String(hausseP);
  doc.getElementById('mpOk').click();
  egal(S.litResignatures()[cleP].salaire, hausseP, 'Hausse volontaire au-dessus du minimum conservée');

  // changement de statut : les durées se recalculent
  const btnP3 = [...doc.querySelectorAll('button.btn-prolong[data-nom]')].find(b=>b.dataset.nom===nomP);
  btnP3.click();
  const selSt = doc.getElementById('mpStatut');
  selSt.value = 'SANS';
  selSt.dispatchEvent(new W.Event('change'));
  egal(doc.getElementById('mpDuree').options.length, 1, 'Statut «Sans contrat» → une seule durée offerte (1 an)');
  doc.getElementById('mpAnnuler').click();
  ok(doc.getElementById('modalProlong').hidden, 'Annuler ferme la fenêtre');
  egal(S.litResignatures()[cleP].salaire, hausseP, 'Annuler ne modifie pas la prolongation enregistrée');

  // retrait
  const btnP4 = [...doc.querySelectorAll('button.btn-prolong[data-nom]')].find(b=>b.dataset.nom===nomP);
  btnP4.click();
  doc.getElementById('mpRetirer').click();
  ok(!S.litResignatures()[cleP], '«Retirer la prolongation» supprime l\'entrée');
  W.localStorage.removeItem('sjs_resignatures_v1');

  console.log('— Divers');
  egal(S.matchsEquipe(), 6, 'Fiche ISLANDERS 2-4-0 → 6 matchs (Y22 en cours)');

  console.log('— XtraStats en repli de TeamScoring (archive ou saison courante)');
  const xtraY21 = [{nom:'Aa', gp:82}, {nom:'Bb', gp:75}];
  const xtraY22 = [{nom:'Aa', gp:9}, {nom:'Bb', gp:10}];
  egal(S.xtraEstArchive(xtraY21, 0), true, 'Club à 0 match → archive Y21');
  egal(S.xtraEstArchive(xtraY21, 10), true, 'GP max 82 pour un club à 10 matchs → archive');
  egal(S.xtraEstArchive(xtraY22, 10), false, 'GP max 10 pour un club à 10 matchs → saison courante');
  egal(S.xtraEstArchive(xtraY22, 82), false, 'Fin de saison : GP max ≈ matchs du club → saison courante');
  // repli effectif : sans TeamScoring, XtraStats devient la source de production
  const ETAT = S.ETAT;
  ok(!!ETAT, 'État global accessible pour la simulation du repli');
  if (ETAT){
    const avantY21 = ETAT.xtraEstY21, avantScoring = ETAT.scoring;
    ETAT.xtraEstY21 = false;            // XtraStats jugé «saison courante»
    ETAT.scoring = {patineurs:[], gardiens:[]}; // TeamScoring indisponible
    const avantXtra = ETAT.xtra;
    ETAT.xtra = [{nom:'Jack Hughes', gp:9, goals:4, assists:6, pts:10, shots:25, pim:2, mp:180, hits:8}];
    const jAho = S.SECOURS_ROSTER.find(x2=>x2.nom==='Jack Hughes');
    const prodRepli = S.productionDe(jAho);
    ok(!!prodRepli && prodRepli._xtraSource===true, 'Production servie par XtraStats (drapeau _xtraSource)');
    egal(prodRepli?.pts, 10, 'Points lus depuis XtraStats en repli');
    ETAT.xtra = avantXtra;
    egal(prodRepli?._reference, false, 'Pas traitée comme simple référence Y21');
    ETAT.xtraEstY21 = avantY21; ETAT.scoring = avantScoring;
  }

  console.log('— Bouton Effacer la cache');
  const btnCache = doc.querySelector('#btnEffacerCache');
  ok(!!btnCache, 'Bouton présent dans l\'en-tête');
  W.localStorage.setItem('sjs_cache_v1', '{"roster":{"t":1,"v":"x"}}');
  W.localStorage.setItem('sjs_proxy_prefere_v1', '2');
  btnCache.click();
  egal(W.localStorage.getItem('sjs_cache_v1'), null, 'Cache de données effacée');
  egal(W.localStorage.getItem('sjs_proxy_prefere_v1'), null, 'Relais préféré réinitialisé');
  await new Promise(r=>setTimeout(r,100)); // laisser l'actualisation (hors ligne) se terminer proprement

  console.log('— Mode vérification Y21');  const btnY21 = doc.querySelector('#btnModeY21');
  ok(!!btnY21, 'Bouton de bascule présent');
  egal(S.ETAT.modeY21, false, 'Saison en cours par défaut à l\'ouverture');
  btnY21.click();
  egal(S.ETAT.modeY21, true, 'Bascule activée');
  ok(doc.querySelector('#bandeauY21').style.display !== 'none', 'Bandeau de vérification affiché');
  const prodY21 = S.productionDe(S.SECOURS_ROSTER.find(x2=>x2.nom==='Sidney Crosby'));
  egal(prodY21?._modeY21, true, 'Production servie par les données Y21 intégrées');
  egal(prodY21?.pts, 92, 'Points Y21 de Crosby');
  const carteCros = [...doc.querySelectorAll('#progGrille .joueur-carte')]
    .find(c=>c.querySelector('.jc-nom').textContent==='Sidney Crosby');
  ok(!!carteCros, 'Carte de Crosby rendue en mode Y21');
  ok(carteCros.textContent.includes('Mode vérification Y21'), 'Note du mode Y21 sur la carte');
  // Crosby, 38 ans : Mémorable au PCTG (18,98 % > 16,5), Satisfaisante en points
  const jCr = S.ETAT.roster.find(x2=>x2.nom==='Sidney Crosby');
  const evPctC = S.evaluerStat('shotpct', S.valeurStat(jCr, prodY21, 'shotpct', {}), S.seuilsPour(jCr, 'shotpct', {}, {}).seuils);
  egal(evPctC.statut, 'memorable', 'Crosby MÉMORABLE au PCTG (18,98 % > 16,5, Elite OV 84) — 41 buts sur 216 tirs à 38 ans');
  const evPtsC = S.evaluerStat('pts', S.valeurStat(jCr, prodY21, 'pts', {}), S.seuilsPour(jCr, 'pts', {}, {}).seuils);
  egal(evPtsC.statut, 'satisfaisante', 'Crosby Satisfaisante en points (85 < 92 ≤ 98, Elite OV 84)');
  // Kyrou : Mémorable en points, mais 46 passes = seuil Mémorable EXACT → Excellente (dépassement strict)
  const jKy = S.ETAT.roster.find(x2=>x2.nom==='Jordan Kyrou');
  const prodKy = S.productionDe(jKy);
  const evPtsK = S.evaluerStat('pts', S.valeurStat(jKy, prodKy, 'pts', {}), S.seuilsPour(jKy, 'pts', {}, {}).seuils);
  egal(evPtsK.statut, 'memorable', 'Kyrou MÉMORABLE en points (83 > 73, Playmaker OV 80)');
  const evAK = S.evaluerStat('assists', S.valeurStat(jKy, prodKy, 'assists', {}), S.seuilsPour(jKy, 'assists', {}, {}).seuils);
  egal(evAK.statut, 'excellente', 'Kyrou 46 passes = seuil Mémorable EXACT → Excellente (dépassement strict, tableau 18)');
  // Hughes : 86 points = seuil Excellente exact → Satisfaisante
  const jHu = S.ETAT.roster.find(x2=>x2.nom==='Jack Hughes');
  const evPtsH = S.evaluerStat('pts', S.valeurStat(jHu, S.productionDe(jHu), 'pts', {}), S.seuilsPour(jHu, 'pts', {}, {}).seuils);
  egal(evPtsH.statut, 'satisfaisante', 'Hughes 86 points = seuil Excellente EXACT → Satisfaisante (Elite OV 83)');
  // Pettersson : Mémorable en passes (66 > 62, Playmaker OV 84)
  const jPe = S.ETAT.roster.find(x2=>x2.nom==='Elias Pettersson');
  const evAP = S.evaluerStat('assists', S.valeurStat(jPe, S.productionDe(jPe), 'assists', {}), S.seuilsPour(jPe, 'assists', {}, {}).seuils);
  egal(evAP.statut, 'memorable', 'Pettersson MÉMORABLE en passes (66 > 62, Playmaker OV 84)');
  // Demidov, 20 ans : Mémorable écrasant en points (71 > 42, Junior Elite OV 77)
  const jDe = S.ETAT.roster.find(x2=>x2.nom==='Ivan Demidov');
  const evPtsD = S.evaluerStat('pts', S.valeurStat(jDe, S.productionDe(jDe), 'pts', {}), S.seuilsPour(jDe, 'pts', {}, {}).seuils);
  egal(evPtsD.statut, 'memorable', 'Demidov MÉMORABLE en points (71 > 42, Junior Elite OV 77) — recrue de 20 ans');
  // Seider : DOUBLE Mémorable (252 MEÉ > 231 et 52 points > 39, DEliteShutdown OV 82)
  const jSe = S.ETAT.roster.find(x2=>x2.nom==='Moritz Seider');
  const prodSe = S.productionDe(jSe);
  const evHitS = S.evaluerStat('hits', S.valeurStat(jSe, prodSe, 'hits', {}), S.seuilsPour(jSe, 'hits', {}, {}).seuils);
  egal(evHitS.statut, 'memorable', 'Seider MÉMORABLE en MEÉ (252 > 231, DEliteShutdown OV 82)');
  const evPtsS = S.evaluerStat('pts', S.valeurStat(jSe, prodSe, 'pts', {}), S.seuilsPour(jSe, 'pts', {}, {}).seuils);
  egal(evPtsS.statut, 'memorable', 'Seider MÉMORABLE en points aussi (52 > 39) — double Mémorable');
  // Urbom : Mémorable en MEÉ/20 (3,22 > 2,03, DDefensive OV 80)
  const jUr = S.ETAT.roster.find(x2=>x2.nom==='Alexander Urbom');
  const evH20U = S.evaluerStat('hits20', S.valeurStat(jUr, S.productionDe(jUr), 'hits20', {}), S.seuilsPour(jUr, 'hits20', {}, {}).seuils);
  egal(evH20U.statut, 'memorable', 'Urbom MÉMORABLE en MEÉ/20 (3,22 > 2,03, DDefensive OV 80) — 212 MEÉ');
  // Vilardi : À oublier (21 minutes en 14 matchs, Depth Forward évalué sur MIN)
  const jVi = S.ETAT.roster.find(x2=>x2.nom==='Gabriel Vilardi');
  const evMpV = S.evaluerStat('mp', S.valeurStat(jVi, S.productionDe(jVi), 'mp', {}), S.seuilsPour(jVi, 'mp', {}, {}).seuils);
  egal(evMpV.statut, 'oublier', 'Vilardi À OUBLIER en minutes (21 ≤ seuil Décevante 138, Depth Forward OV 76)');
  // tous les patineurs du roster actuel ont une ligne Y21 (aucun trou, rien d'inventé)
  const patineurs = S.SECOURS_ROSTER.filter(x2=>x2.po!=='G');
  egal(patineurs.filter(x2=>S.SECOURS_Y21.find(y=>y.nom===x2.nom)).length, 20,
    'Les 20 patineurs du roster ont chacun leur ligne Y21 (gardiens exclus par convention)');
  ok(!carteCros.textContent.includes('proj.'), 'Aucune projection affichée (saison complète)');
  btnY21.click();
  egal(S.ETAT.modeY21, false, 'Retour à la saison en cours');
  ok(doc.querySelector('#bandeauY21').style.display === 'none', 'Bandeau retiré');

  console.log(`\n${total - echecs}/${total} vérifications réussies`);
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error('ERREUR FATALE', e); process.exit(1); });
