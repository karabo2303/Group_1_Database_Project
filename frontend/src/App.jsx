import './App.css'
import LoginSignUp from './Components/LoginSignUp/LoginSignup'
import AdminPage from './Components/Admin Page/adminPage'
import VotersPage from './Components/Voters Page/votersPage'
import {Routes,Route} from 'react-router-dom';

function App() {
 
  return (
    <div>
      <Routes>
      <Route path="/" element={<LoginSignUp/>}/>
      <Route path ="/admin" element={<AdminPage/>}/>
       <Route path ="/voterss" element={<VotersPage/>}/>
      </Routes>
    </div>
  )
}

export default App
