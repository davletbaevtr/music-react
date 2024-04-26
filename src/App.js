import './App.css';
import {BrowserRouter} from "react-router-dom";
import Router from "./router/router";
import MyAppBar from "./components/UI/MyAppBar";
import {useContext, useEffect} from "react";
import {Context} from "./index";
import {observer} from "mobx-react-lite";
import {CircularProgress} from "@mui/material";

function App() {
    const {store} = useContext(Context);

    useEffect(() => {
        store.checkAuth();
    }, []);

    return (
        <div style={{overflow: "auto"}}>
            <div style={{
                minWidth: 1200, minHeight: "98vh", display: "flex", flexDirection: "column", alignItems: "center"
            }}>
                {store.is_loading
                    ?
                    <CircularProgress/>
                    :
                    <BrowserRouter>
                        <MyAppBar/>
                        <Router/>
                    </BrowserRouter>
                }
            </div>
        </div>
    );
}

export default observer(App);
