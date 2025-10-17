import './App.css'
import ClaimReward from './components/ClaimReward'

function App() {
  
  return (
    <div className='app-container'>
      <header>Base Account <span className='highlight'>Paymaster</span></header>
      <p className='subtitle'>Claim rewards with gasless transactions</p>
      <main>
        <ClaimReward />
      </main>
    </div>
  )
}

export default App
