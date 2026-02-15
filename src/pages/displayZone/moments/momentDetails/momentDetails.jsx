import React from 'react';
import Content from "./content/content";
import MomentsComments from "./comment/momentsComments";
import mdc from './md.module.less';

const MomentDetails = ({ headshotType }) => {
	return (
		<div className={mdc.entire}>
			<Content headshotType={headshotType} />
			<MomentsComments/>
		</div>
	);
};

export default MomentDetails;