// Brazil states and their major cities (no external API needed)
export interface BrazilLocation {
  uf: string;
  name: string;
  cities: string[];
}

export const BRAZIL_LOCATIONS: BrazilLocation[] = [
  {
    uf: 'AC', name: 'Acre',
    cities: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasiléia'],
  },
  {
    uf: 'AL', name: 'Alagoas',
    cities: ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Marechal Deodoro', 'Rio Largo', 'Penedo', 'União dos Palmares'],
  },
  {
    uf: 'AP', name: 'Amapá',
    cities: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão'],
  },
  {
    uf: 'AM', name: 'Amazonas',
    cities: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Tefé', 'Coari', 'Tabatinga', 'Maués'],
  },
  {
    uf: 'BA', name: 'Bahia',
    cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Ilhéus', 'Juazeiro', 'Lauro de Freitas', 'Jequié', 'Alagoinhas', 'Barreiras', 'Porto Seguro', 'Paulo Afonso'],
  },
  {
    uf: 'CE', name: 'Ceará',
    cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá'],
  },
  {
    uf: 'DF', name: 'Distrito Federal',
    cities: ['Brasília', 'Ceilândia', 'Taguatinga', 'Gama', 'Samambaia', 'Planaltina', 'Guará', 'Águas Claras', 'Sobradinho', 'Santa Maria'],
  },
  {
    uf: 'ES', name: 'Espírito Santo',
    cities: ['Vitória', 'Serra', 'Vila Velha', 'Cariacica', 'Cachoeiro de Itapemirim', 'Linhares', 'Guarapari', 'São Mateus', 'Colatina'],
  },
  {
    uf: 'GO', name: 'Goiás',
    cities: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Catalão'],
  },
  {
    uf: 'MA', name: 'Maranhão',
    cities: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal'],
  },
  {
    uf: 'MT', name: 'Mato Grosso',
    cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Sorriso', 'Barra do Garças', 'Cáceres'],
  },
  {
    uf: 'MS', name: 'Mato Grosso do Sul',
    cities: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Naviraí', 'Nova Andradina', 'Aquidauana'],
  },
  {
    uf: 'MG', name: 'Minas Gerais',
    cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Poços de Caldas', 'Patos de Minas'],
  },
  {
    uf: 'PA', name: 'Pará',
    cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal', 'Abaetetuba', 'Cametá', 'Itaituba', 'Altamira'],
  },
  {
    uf: 'PB', name: 'Paraíba',
    cities: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Guarabira'],
  },
  {
    uf: 'PR', name: 'Paraná',
    cities: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Pinhais'],
  },
  {
    uf: 'PE', name: 'Pernambuco',
    cities: ['Recife', 'Caruaru', 'Olinda', 'Jaboatão dos Guararapes', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Caruaru', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão'],
  },
  {
    uf: 'PI', name: 'Piauí',
    cities: ['Teresina', 'Parnaíba', 'Picos', 'Floriano', 'Piripiri', 'Campo Maior', 'Barras'],
  },
  {
    uf: 'RJ', name: 'Rio de Janeiro',
    cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda', 'Magé', 'Itaboraí', 'Mesquita', 'Macaé', 'Nova Friburgo', 'Resende'],
  },
  {
    uf: 'RN', name: 'Rio Grande do Norte',
    cities: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Caicó', 'Ceará-Mirim', 'Assu', 'Macaíba'],
  },
  {
    uf: 'RS', name: 'Rio Grande do Sul',
    cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Cachoeirinha'],
  },
  {
    uf: 'RO', name: 'Rondônia',
    cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Cacoal', 'Vilhena', 'Rolim de Moura', 'Guajará-Mirim'],
  },
  {
    uf: 'RR', name: 'Roraima',
    cities: ['Boa Vista', 'Caracaraí', 'Rorainópolis', 'Alto Alegre', 'Mucajaí'],
  },
  {
    uf: 'SC', name: 'Santa Catarina',
    cities: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó', 'Itajaí', 'Lages', 'Palhoça', 'Balneário Camboriú', 'Brusque', 'Tubarão', 'Caçador', 'Concórdia'],
  },
  {
    uf: 'SP', name: 'São Paulo',
    cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'São José dos Campos', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'Santos', 'Mogi das Cruzes', 'Diadema', 'Jundiaí', 'Carapicuíba', 'Piracicaba', 'Bauru', 'São José do Rio Preto', 'Franca', 'Limeira', 'Suzano', 'Taboão da Serra', 'Barueri', 'Americana', 'Marília', 'Presidente Prudente', 'Taubaté'],
  },
  {
    uf: 'SE', name: 'Sergipe',
    cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto'],
  },
  {
    uf: 'TO', name: 'Tocantins',
    cities: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Colinas do Tocantins', 'Guaraí'],
  },
];

// Helper: get cities by UF
export function getCitiesByUF(uf: string): string[] {
  return BRAZIL_LOCATIONS.find(loc => loc.uf === uf)?.cities ?? [];
}
