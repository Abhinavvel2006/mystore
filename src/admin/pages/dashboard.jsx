import { NavLink } from "react-router-dom";
import "./dashboard.css"
import axios from "axios";


function Dashboard(){

    return(
        <div className="dashboard-container">
            <h2>DashBoard</h2>
            <p>Welcome back, Admin User!</p>

        </div>
    );
}

export default Dashboard;