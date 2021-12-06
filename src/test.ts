import * as addressesApi from './modules/apis/AddressesApi'

addressesApi.get('fromZip/410.json.br').then((res: string) => {
  console.log(res)
})
