export const MAIN_ROUTE = '/'
export const API_URL = 'https://api.meloparty.ru'
export const WS_API_URL = 'ws://api.meloparty.ru'

export const ROOMS_ROUTE = '/rooms/'

export const RULES_ROUTE = '/rules/'
export const NavRoutes = [
    {
        path: MAIN_ROUTE,
        name: 'Главная',
    },
    {
        path: ROOMS_ROUTE,
        name: 'Комнаты',
    },
    {
        path:  RULES_ROUTE,
        name: 'Правила',
    }
]