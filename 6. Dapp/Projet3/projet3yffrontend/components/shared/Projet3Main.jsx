import { useState, useEffect } from "react"
import { parseAbiItem } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { contractAddress, contractAbi } from "@/constants"
import { publicClient } from "@/utils/client";

// components
import WorkflowStatus from "./WorkflowStatus";
import AddVoter from "./AddVoter";
import AddProposal from "./AddProposal";
import Vote from "./Vote";
import TallyVote from "./TallyVote";
import GetWinningProposal from "./GetWinningProposal"
import Event from "./Events";

// UI
import { Button } from "../ui/button";

// function
const Projet3Main = () => {
    const [events, setEvents] = useState([])
    const { address } = useAccount()
    const { data: hash, isSuccess, refetch } = useReadContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "workflowStatus"
    })

    const getEvents = async () => {
        const workflowStatusChange = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem('event WorkflowStatusChange(uint8 previousStatus, uint8 newStatus)'),
            fromBlock: 0n,
        })
        const voterRegisteredEvents = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem('event VoterRegistered(address voterAddress)'),
            fromBlock: 0n,
        })
        const proposalRegisteredEvents = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem('event ProposalRegistered(uint proposalId)'),
            fromBlock: 0n,
        })
        const votedEvents = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem('event Voted(address voter, uint proposalId)'),
            fromBlock: 0n,
        })

        const combinedEvents = workflowStatusChange.map((event) => ({
            eventName: event.eventName,
            oldValue: event.args.previousStatus,
            newValue: event.args.newStatus,
            blockNumber: Number(event.blockNumber)
        })).concat(
            voterRegisteredEvents.map((event) => ({
                eventName: event.eventName,
                newValue: `Voter added ${event.args.voterAddress}`,
                blockNumber: Number(event.blockNumber)
            })),
            proposalRegisteredEvents.map((event) => ({
                eventName: event.eventName,
                newValue: `Proposal added ${Number(event.args.proposalId)}`,
                blockNumber: Number(event.blockNumber)
            })),
            votedEvents.map((event) => ({
                eventName: event.eventName,
                newValue: `Voter ${event.args.voter} vote for proposal ID ${Number(event.args.proposalId)}`,
                blockNumber: Number(event.blockNumber)
            }))
        )

        combinedEvents.sort(function (a, b) {
            return b.blockNumber - a.blockNumber;
        });

        setEvents(combinedEvents)
    }

    useEffect(() => {
        const getAllEvents = async () => {
            if (address !== undefined) {
                await getEvents();
            }
            if (events.length > events.length) {
                await getEvents();
            }
        }
        getAllEvents();
    }, [address])

    const refetchAll = async () => {
        await getEvents();
        await refetch();
    }

    useEffect(() => {
        if (isSuccess) {
            refetchAll()
            getEvents()
        }
    }, [isSuccess])

    return (
        <div className={`space-y-5`}>
            <WorkflowStatus />
            <AddVoter />
            <AddProposal />
            <Vote />
            <TallyVote />
            <GetWinningProposal />
            <section>
                <h3 className="font-bold">Events</h3>
                <div className="flex flex-col w-full">
                    {events.length > 0 && events.map((event) => {
                        return (
                            <Event event={event} key={crypto.randomUUID()} />
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

export default Projet3Main;