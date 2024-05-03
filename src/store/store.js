import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import {API_URL} from "../utils/consts";
import log from 'loglevel';

log.setLevel(log.levels.DEBUG);

export default class Store {
    username = 'Игрок'
    user_id = ''
    is_loading = true;
    is_server_error = false;
    room_id = -1;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    async checkAuth() {
        const user_id = localStorage.getItem('user_id');
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(user_id)) {
            try {
                log.debug(`try to post ${API_URL}/api/check_user/ with data`, { user_id: user_id })
                await axios.post(`${API_URL}/api/check_user/`, { user_id: user_id });
                log.debug(`200 from ${API_URL}/api/check_user/`)
                runInAction(() => {
                    this.user_id = user_id;
                    this.username = localStorage.getItem('username')
                });
            } catch (error) {
                log.debug(`error ${API_URL}/api/check_user/`, error)
                try {
                    log.debug(`try to post ${API_URL}/api/create_user/ with data`, { username: this.username })
                    const { data } = await axios.post(`${API_URL}/api/create_user/`, { username: this.username });
                    log.debug(`200 from ${API_URL}/api/create_user/ with response.data`, data)
                    runInAction(() => {
                        this.setUserId(data.user_id);
                        localStorage.setItem('username', this.username);
                        localStorage.setItem('warning1', 'Удалив или поменяв данные здесь вы сломаете себе и только себе игру');
                        localStorage.setItem('warning2', 'если поменяв у вас сломалась игра, удалите все строки и обновите страницу');
                    });
                } catch (error) {
                    log.debug(`error ${API_URL}/api/create_user/`, error)
                    runInAction(() => {
                        this.is_server_error = true;
                    });
                }
            }
        } else {
            try {
                log.debug(`try to post ${API_URL}/api/create_user/ with data`, { username: this.username })
                const { data } = await axios.post(`${API_URL}/api/create_user/`, { username: this.username });
                log.debug(`200 from ${API_URL}/api/create_user/ with response.data`, data)
                runInAction(() => {
                    this.setUserId(data.user_id);
                    localStorage.setItem('username', this.username);
                    localStorage.setItem('warning1', 'Удалив или поменяв данные здесь вы сломаете себе и только себе игру');
                    localStorage.setItem('warning2', 'если поменяв у вас сломалась игра, удалите все строки и обновите страницу');
                });
            } catch (error) {
                log.debug(`error ${API_URL}/api/create_user/`, error)
                runInAction(() => {
                    this.is_server_error = true;
                });
            }
        }
        this.setLoading(false);
    }

    async setUsername(str) {
        try {
            await axios.post(`${API_URL}/api/update_user/`, { username: str, user_id: this.user_id, room_id: this.room_id });
            runInAction(() => {
                this.username = str;
                localStorage.setItem('username', str);
            });
        } catch (error) {
            runInAction(() => {
                this.is_server_error = true;
            });
        }
    }

    setUserId(str) {
        runInAction(() => {
            this.user_id = str;
            localStorage.setItem('user_id', str);
        });
    }

    setLoading(bool) {
        runInAction(() => {
            this.is_loading = bool;
        });
    }
}
