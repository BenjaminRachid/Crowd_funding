import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Crowdfunding from './contracts/Crowdfunding.json';
import { useParams, Link } from 'react-router-dom';
import './App.css';  // Assurez-vous que le fichier CSS est importé

const CampaignDetail = ({ isAdmin, account }) => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [contract, setContract] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [comments, setComments] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          const networkId = await web3.eth.net.getId();
          const deployedNetwork = Crowdfunding.networks[networkId];
          if (deployedNetwork) {
            const instance = new web3.eth.Contract(
              Crowdfunding.abi,
              deployedNetwork.address
            );
            setContract(instance);

            const campaign = await instance.methods.campaigns(id).call();
            setCampaign({
              ...campaign,
              goal: campaign.goal.toString(),
              amountRaised: campaign.amountRaised.toString(),
              deadline: campaign.deadline.toString()
            });
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    init();
  }, [id]);

  const handleNewUpdateChange = (e) => {
    setNewUpdate(e.target.value);
  };

  const handleNewCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleAddUpdate = () => {
    setUpdates([...updates, newUpdate]);
    setNewUpdate('');
  };

  const handleAddComment = () => {
    setComments([...comments, newComment]);
    setNewComment('');
  };

  if (!campaign) return <div>Loading...</div>;

  return (
    <div className="campaign-details">
      <h2>Campaign Details</h2>
      <p><strong>Campaign ID:</strong> {id}</p>
      <p><strong>Goal:</strong> {Web3.utils.fromWei(campaign.goal, 'ether')} ETH</p>
      <p><strong>Amount Raised:</strong> {Web3.utils.fromWei(campaign.amountRaised, 'ether')} ETH</p>
      <p><strong>Deadline:</strong> {new Date(Number(campaign.deadline) * 1000).toLocaleString()}</p>
      <h3>Updates</h3>
      <ul>
        {updates.map((update, index) => (
          <li key={index}>{update}</li>
        ))}
      </ul>
      {isAdmin && (
        <>
          <textarea
            placeholder="Add an update"
            value={newUpdate}
            onChange={handleNewUpdateChange}
          />
          <button onClick={handleAddUpdate}>Add Update</button>
        </>
      )}
      <h3>Comments</h3>
      <ul>
        {comments.map((comment, index) => (
          <li key={index}>{comment}</li>
        ))}
      </ul>
      <textarea
        placeholder="Add a comment"
        value={newComment}
        onChange={handleNewCommentChange}
      />
      <button onClick={handleAddComment}>Add Comment</button>
      <Link to="/" className="back-button">Back to Home</Link>
    </div>
  );
};

export default CampaignDetail;
