import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Crowdfunding from './contracts/Crowdfunding.json';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CampaignDetail from './CampaignDetail';

const App = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);

          const networkId = await web3.eth.net.getId();
          console.log(`Network ID: ${networkId}`);
          const deployedNetwork = Crowdfunding.networks[networkId];
          if (deployedNetwork) {
            const instance = new web3.eth.Contract(
              Crowdfunding.abi,
              deployedNetwork.address
            );
            setContract(instance);
            console.log("Contract instance:", instance);

            const campaignCount = await instance.methods.campaignCount().call();
            const campaignsArray = [];
            for (let i = 1; i <= campaignCount; i++) {
              const campaign = await instance.methods.campaigns(i).call();
              campaignsArray.push({
                ...campaign,
                id: i,
                goal: campaign.goal.toString(),
                amountRaised: campaign.amountRaised.toString(),
                deadline: campaign.deadline.toString()
              });
            }
            setCampaigns(campaignsArray);
          } else {
            console.error('Smart contract not deployed to the detected network.');
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    init();
  }, []);

  const handleCreateCampaign = async () => {
    if (contract) {
      const web3 = new Web3(window.ethereum);
      const goalInWei = web3.utils.toWei(goal, 'ether');
      const durationInSeconds = Number(duration);

      await contract.methods.createCampaign(goalInWei, durationInSeconds).send({ from: account });
      window.location.reload();
    } else {
      console.error("Contract is not initialized.");
    }
  };

  const handleContribute = async (campaignId) => {
    if (contract) {
      const web3 = new Web3(window.ethereum);
      const contributionAmount = web3.utils.toWei('0.1', 'ether');

      await contract.methods.contribute(campaignId).send({ from: account, value: contributionAmount });
      window.location.reload();
    } else {
      console.error("Contract is not initialized.");
    }
  };

  const handleGoalChange = (e) => {
    setGoal(e.target.value);
  };

  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  const calculateTimeLeft = (deadline) => {
    const now = new Date().getTime();
    const timeLeft = deadline * 1000 - now;

    if (timeLeft <= 0) {
      return { expired: true, time: 'Campaign has ended' };
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return { expired: false, time: `${days}d ${hours}h ${minutes}m ${seconds}s` };
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Crowdfunding Platform</h1>
          <p>Connected account: {account}</p>
        </header>
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <section>
                  <h2>Create Campaign</h2>
                  <input
                    type="text"
                    placeholder="Goal in ETH"
                    value={goal}
                    onChange={handleGoalChange}
                  />
                  <input
                    type="text"
                    placeholder="Duration in seconds"
                    value={duration}
                    onChange={handleDurationChange}
                  />
                  <button onClick={handleCreateCampaign}>Create</button>
                </section>
                <section>
                  <h2>Contribute to Campaigns</h2>
                  {campaigns.map((campaign, index) => {
                    const { expired, time } = calculateTimeLeft(campaign.deadline);
                    return (
                      <div key={index} className="campaign">
                        <p>Campaign ID: {index + 1}</p>
                        <p>Goal: {Web3.utils.fromWei(campaign.goal, 'ether')} ETH</p>
                        <p>Amount Raised: {Web3.utils.fromWei(campaign.amountRaised, 'ether')} ETH</p>
                        <p>Deadline: {new Date(Number(campaign.deadline) * 1000).toLocaleString()}</p>
                        <p>Time Left: {time}</p>
                        <button onClick={() => handleContribute(index + 1)} disabled={expired}>Contribute 0.1 ETH</button>
                        <Link to={`/campaign/${campaign.id}`}>View Details</Link>
                      </div>
                    );
                  })}
                </section>
              </>
            } />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
