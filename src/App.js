import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Crowdfunding from './contracts/Crowdfunding.json';
import './App.css';

const App = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
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

          const campaignCount = await instance.methods.campaignCount().call();
          const campaignsArray = [];
          for (let i = 1; i <= campaignCount; i++) {
            const campaign = await instance.methods.campaigns(i).call();
            campaignsArray.push(campaign);
          }
          setCampaigns(campaignsArray);
        } else {
          console.error('Smart contract not deployed to the detected network.');
        }
      }
    };

    init();
  }, []);

  const createCampaign = async () => {
    const web3 = new Web3(window.ethereum);
    const goalInWei = web3.utils.toWei(goal, 'ether');
    const durationInSeconds = parseInt(duration, 10);

    await contract.methods.createCampaign(goalInWei, durationInSeconds).send({ from: account });
    window.location.reload();
  };

  const contribute = async (campaignId) => {
    const web3 = new Web3(window.ethereum);
    const contributionAmount = web3.utils.toWei('0.1', 'ether');

    await contract.methods.contribute(campaignId).send({ from: account, value: contributionAmount });
    window.location.reload();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Crowdfunding Platform</h1>
        <p>Connected account: {account}</p>
      </header>
      <main>
        <section>
          <h2>CREATE COMPAIGN</h2>
          <input
            type="text"
            placeholder="Goal in ETH"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <input
            type="text"
            placeholder="Duration in seconds"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <button onClick={createCampaign}>CREATE</button>
        </section>
        <section>
          <h2>Contribute to Campaigns</h2>
          {campaigns.map((campaign, index) => (
            <div key={index} className="campaign">
              <p>Campaign ID: {index + 1}</p>
              <p>Goal: {Web3.utils.fromWei(campaign.goal, 'ether')} ETH</p>
              <p>Amount Raised: {Web3.utils.fromWei(campaign.amountRaised, 'ether')} ETH</p>
              <p>Deadline: {new Date(campaign.deadline * 1000).toLocaleString()}</p>
              <button onClick={() => contribute(index + 1)}>Contribute 0.1 ETH</button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default App;