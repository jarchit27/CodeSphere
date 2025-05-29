export const validateEmail = (email) =>{
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};
export const getInitials=(name)=>{
    if(!name) return "";
    const words = name.split(" ");
    let intials ="";
    for (let index = 0; index < Math.min(words.length, 2); index++) {
        intials+= words[index][0];    
    }
    return intials.toUpperCase();
};

export const getColorByRating = (rating) => {
    if (!rating) return 'text-gray-500';
    if (rating < 1200) return 'text-gray-500';
    if (rating < 1400) return 'text-green-600';
    if (rating < 1600) return 'text-cyan-600';
    if (rating < 1900) return 'text-blue-600';
    if (rating < 2100) return 'text-fuchsia-700';
    if (rating < 2300) return 'text-orange-400';
    if (rating < 2400) return 'text-orange-500';
    return 'text-red-600';
};

export const getRankTitle = (rating) => {
    if (!rating) return "Unrated";
    if (rating < 1200) return "Newbie";
    if (rating < 1400) return "Pupil";
    if (rating < 1600) return "Specialist";
    if (rating < 1900) return "Expert";
    if (rating < 2100) return "Candidate Master";
    if (rating < 2300) return "Master";
    if (rating < 2400) return "International Master";
    if (rating < 3000) return "Grandmaster";
    return "Legendary Grandmaster";
};

export const getBgColorByRating = (rating) => {
    if (!rating) return 'bg-gray-100';
    if (rating < 1200) return 'bg-gray-100';
    if (rating < 1400) return 'bg-green-50';
    if (rating < 1600) return 'bg-cyan-50';
    if (rating < 1900) return 'bg-blue-50';
    if (rating < 2100) return 'bg-fuchsia-100';
    if (rating < 2300) return 'bg-orange-50';
    if (rating < 2400) return 'bg-orange-100';
    return 'bg-red-100';
};