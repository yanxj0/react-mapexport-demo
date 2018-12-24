const PAPER_CHANGE = 'PAPER_CHANGE'

export default function (state, action) {
    if(!state){
        state = { paper:'A4 H' };
    }

    switch(action.type){
        case PAPER_CHANGE:
            return {paper: action.payload};
        default:
            return state;
    }
}