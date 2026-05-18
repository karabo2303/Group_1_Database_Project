import './App.css'
import LoginSignUp from './Components/LoginSignUp/LoginSignup'
import AdminPage from './Components/Admin Page/adminPage'
import VotersPage from './Components/Voters Page/votersPage'
import VotePage from './Components/VotePage'
import ResultsPage from './Components/ResultsPage'
import CreateElectionPage from './Components/CreateElectionPage'
import ManageUsersPage from './Components/ManageUsersPage'
import AuditLogsPage from './Components/AuditLogsPage'
import CandidatePage from './Components/CandidatePage'
import CandidateProfilePage from './Components/CandidateProfilePage'
import ApplyPositionPage from './Components/ApplyPositionPage'
import ElectionOfficialPage from './Components/ElectionOfficialPage'
import OversightOfficerPage from './Components/OversightOfficerPage'
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<LoginSignUp />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/create-election" element={<CreateElectionPage />} />
        <Route path="/manage-users" element={<ManageUsersPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        
        {/* Voter Routes */}
        <Route path="/voter" element={<VotersPage />} />
        <Route path="/vote/:electionId" element={<VotePage />} />
        
        {/* Results Routes */}
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/results/:electionId" element={<ResultsPage />} />
        
        {/* Candidate Routes */}
        <Route path="/candidate" element={<CandidatePage />} />
        <Route path="/candidate/profile" element={<CandidateProfilePage />} />
        <Route path="/apply-position" element={<ApplyPositionPage />} />
        
        {/* Official Routes */}
        <Route path="/official" element={<ElectionOfficialPage />} />
        <Route path="/oversight" element={<OversightOfficerPage />} />
      </Routes>
    </div>
  )
}

export default App;