import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ViewAnalysis from "../ViewAnalysis/ViewAnalysis";

const Profile = () => {
  const { handle } = useParams();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userInfoRes, ratingRes, submissionsRes] = await Promise.all([
          fetch(`https://codeforces.com/api/user.info?handles=${handle}`),
          fetch(`https://codeforces.com/api/user.rating?handle=${handle}`),
          fetch(`https://codeforces.com/api/user.status?handle=${handle}`),
        ]);

        const userInfoJson = await userInfoRes.json();
        const ratingJson = await ratingRes.json();
        const submissionsJson = await submissionsRes.json();

        if (
          userInfoJson.status !== "OK" ||
          ratingJson.status !== "OK" ||
          submissionsJson.status !== "OK"
        ) {
          throw new Error("Failed to fetch some data");
        }

        setUserInfo(userInfoJson.result[0]);
        setRatingHistory(ratingJson.result);
        setSubmissions(submissionsJson.result);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Codeforces data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [handle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 text-lg text-gray-600 animate-pulse">
        Loading profile for <span className="font-semibold">@{handle}</span>...
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 text-red-600 text-center">
        Error: No user data found for <span className="font-semibold">@{handle}</span>
      </div>
    );
  }

  return (
    <>
      <ViewAnalysis
        userInfo={userInfo}
        ratingHistory={ratingHistory}
        submissions={submissions}
      />
    </>
  );
};

export default Profile;
