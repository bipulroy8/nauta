/**
 * INTEL CONFIDENTIAL
 * Copyright (c) 2018 Intel Corporation
 *
 * The source code contained or described herein and all documents related to
 * the source code ("Material") are owned by Intel Corporation or its suppliers
 * or licensors. Title to the Material remains with Intel Corporation or its
 * suppliers and licensors. The Material contains trade secrets and proprietary
 * and confidential information of Intel or its suppliers and licensors. The
 * Material is protected by worldwide copyright and trade secret laws and treaty
 * provisions. No part of the Material may be used, copied, reproduced, modified,
 * published, uploaded, posted, transmitted, distributed, or disclosed in any way
 * without Intel's prior express written permission.
 *
 * No license under any patent, copyright, trade secret or other intellectual
 * property right is granted to or conferred upon you by disclosure or delivery
 * of the Materials, either expressly, by implication, inducement, estoppel or
 * otherwise. Any license under such intellectual property rights must be express
 * and approved by Intel in writing.
 */

import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';
import sinon from 'sinon';
import VueRouter from 'vue-router'
import {shallowMount, createLocalVue} from '@vue/test-utils';
import ModelsTable from '../../../../src/components/ModelsTable';
import Q from 'q';
import messages from '../../../../src/utils/constants/messages';

describe('VUE components ModelsTable', () => {
  let wrapper, router, store, state, getters, actions, localVue, defered, context;
  beforeEach(function () {
    context = {
      messages: messages
    };
    state = {
      fetchingDataActive: false,
      experiments: {
        data: [],
        params: ['param1', 'param2', 'param3'],
        stats: {
          total: 0,
          a: 0,
          b: 0,
          pageNumber: 0,
          totalPagesCount: 0,
          filteredDataCount: 0,
          datetime: 0
        }
      },
      tensorMode: false,
      isLogged: true,
      initializedDataFlag: true,
      tensorboardLaunching: false,
      username: 'anonymous'
    };
    getters = {
      experimentsData: state => state.experiments.data,
      experimentsParams: state => state.experiments.params,
      experimentsBegin: state => state.experiments.stats.a,
      experimentsTotal: state => state.experiments.stats.total,
      filteredDataCount: state => state.experiments.stats.filteredDataCount,
      experimentsEnd: state => state.experiments.stats.b,
      experimentsPageNumber: state => state.experiments.stats.pageNumber,
      experimentsTotalPagesCount: state => state.experiments.stats.totalPagesCount,
      lastUpdate: state => state.experiments.stats.datetime,
      fetchingDataActive: state => state.fetchingDataActive,
      tensorMode: state => state.tensorMode,
      isLogged: state => state.isLogged,
      initializedDataFlag: state => state.initializedDataFlag,
      tensorboardLaunching: state => state.tensorboardLaunching,
      username: state => state.username
    };
    defered = Q.defer();
    actions = {
      getUserExperiments: sinon.spy(),
      enableTensorMode: sinon.spy(),
      launchTensorboard: sinon.spy(),
      disableTensorMode: sinon.spy(),
      getExperimentResources: sinon.stub().returns(defered.promise)
    };
    store = new Vuex.Store({
      state,
      actions,
      getters
    });
    localVue = createLocalVue();
    localVue.use(Vuex);
    localVue.use(VueRouter);
    localVue.use(Vuetify);
    router = new VueRouter();
    setInterval = sinon.spy();
    clearInterval = sinon.spy();
    wrapper = shallowMount(ModelsTable, {store, router, localVue});
  });

  it('Should clearInterval on destroy correctly', function () {
    expect(setInterval.calledOnce).to.equal(true);
    wrapper.destroy();
    expect(clearInterval.calledOnce).to.equal(true);
  });

  it('Should return pagination stats correctly', function () {
    const expectedResult = `${state.experiments.stats.a}-${state.experiments.stats.b} of ${state.experiments.stats.filteredDataCount}`;
    expect(wrapper.vm.paginationStats).to.equal(expectedResult);
  });

  it('Should return tensorBtnAvailable correctly', function () {
    expect(wrapper.vm.tensorMode).to.equal(false);
    expect(wrapper.vm.tensorBtnAvailable).to.equal(true);
    wrapper.vm.$store.state.tensorMode = true;
    expect(wrapper.vm.tensorBtnAvailable).to.equal(false);
    wrapper.vm.$store.state.tensorMode = true;
    wrapper.vm.selected = [1];
    expect(wrapper.vm.tensorBtnAvailable).to.equal(true);
  });

  it('Should return customizable visible columns without permament columns', function () {
    wrapper.vm.$store.state.experiments.params = ['name', 'param1'];
    expect(wrapper.vm.customizableVisibilityColumns.includes('param1')).to.equal(true);
    expect(wrapper.vm.customizableVisibilityColumns.includes('name')).to.equal(false);
  });

  it('Should return visible columns (default)', function () {
    expect(wrapper.vm.currentlyVisibleColumns).to.deep.equal([]);
  });

  it('Should return visible columns (one visible)', function () {
    wrapper.vm.selectedByUserColumns = ['param1'];
    expect(wrapper.vm.currentlyVisibleColumns).to.not.deep.equal(state.experiments.params);
    expect(wrapper.vm.currentlyVisibleColumns.includes('param1')).to.equal(true);
  });

  it('Should get data if search pattern provided', function () {
    wrapper.vm.searchPattern = 'test';
    expect(actions.getUserExperiments.calledTwice).to.equal(true);
  });

  it('Should get data if sorting order updated', function () {
    wrapper.vm.sorting.order = 'asc';
    expect(actions.getUserExperiments.calledTwice).to.equal(true);
  });

  it('Should get data if count of items per page updated', function () {
    wrapper.vm.pagination.itemsCountPerPage = 23;
    expect(actions.getUserExperiments.calledTwice).to.equal(true);
  });

  it('Should get data if page number updated', function () {
    wrapper.vm.pagination.currentPage = 23;
    expect(actions.getUserExperiments.calledTwice).to.equal(true);
  });

  it('Should update currentPage if stats provided from backend', function (done) {
    wrapper.vm.$store.state.experiments.stats.pageNumber = 24;
    Vue.nextTick()
      .then(() => {
        expect(wrapper.vm.pagination.currentPage).to.equal(24);
        done()
      }).catch(done);
  });

  it('Should clear sort params on clear sort action', function () {
    wrapper.vm.activeColumnIdx = 999;
    wrapper.vm.activeColumnName = '999';
    wrapper.vm.clearSort();
    expect(wrapper.vm.activeColumnIdx).to.equal(0);
    expect(wrapper.vm.activeColumnName).to.equal('creationTimestamp');
  });

  it('Should set pagination params if count of rows per page updated', function () {
    const currentCount = 50;
    wrapper.vm.updateCountPerPage(currentCount);
    expect(wrapper.vm.pagination.itemsCountPerPage).to.equal(currentCount);
    expect(wrapper.vm.pagination.currentPage).to.equal(1);
  });

  it('Should decrement currentPage if previous page', function () {
    const currentPage = 100;
    wrapper.vm.pagination.currentPage = currentPage;
    wrapper.vm.previousPage();
    expect(wrapper.vm.pagination.currentPage).to.equal(currentPage - 1);
  });

  it('Should increment currentPage if previous page', function () {
    const currentPage = 100;
    wrapper.vm.pagination.currentPage = currentPage;
    wrapper.vm.nextPage();
    expect(wrapper.vm.pagination.currentPage).to.equal(currentPage + 1);
  });

  it('Should set visible columns', function () {
    const visibleColumns = [1, 2, 3];
    const expectedVisibleColumns = [].concat(wrapper.vm.alwaysVisibleColumns, visibleColumns);
    wrapper.vm.setVisibleColumns(visibleColumns);
    expect(wrapper.vm.selectedByUserColumns).to.deep.equal(expectedVisibleColumns);
  });

  it('Should call enableTensorMode on launch btn first click', function () {
    wrapper.vm.onLaunchTensorboardClick();
    expect(actions.enableTensorMode.calledOnce).to.equal(true);
  });

  it('Should call disableTensorMode on launch btn second click', function () {
    wrapper.vm.$store.state.tensorMode = true;
    wrapper.vm.onLaunchTensorboardClick();
    expect(actions.disableTensorMode.calledOnce).to.equal(true);
  });

  it('Should call disableTensorMode on exit btn click', function () {
    wrapper.vm.discardTensorboard();
    expect(actions.disableTensorMode.calledOnce).to.equal(true);
    expect(wrapper.vm.selected).to.deep.equal([]);
  });

  it('Should add exp to selected list', function () {
    const selectedExp = 'exp';
    wrapper.vm.selectExp(selectedExp);
    expect(wrapper.vm.selected).to.deep.equal([selectedExp]);
  });

  it('Should delete exp from selected list on deselect', function () {
    const selectedExp = {attributes:{name: 'test'}};
    wrapper.vm.selected = [selectedExp];
    wrapper.vm.deselectExp(selectedExp);
    expect(wrapper.vm.selected).to.deep.equal([]);
  });

  it('Should check is selected item correctly', function () {
    const selectedExp = {attributes:{name: 'test'}};
    wrapper.vm.selected = [selectedExp];
    const result = wrapper.vm.isSelected(selectedExp);
    expect(result).to.deep.equal(true);
  });

  it('Should not refresh data if younger than 30s', function () {
    Date.now = sinon.stub().returns(1528190409842);
    wrapper.vm.$store.state.experiments.stats.datetime = 1528190409842;
    wrapper.vm.timer(context);
    expect(actions.getUserExperiments.calledOnce).to.equal(true);
    expect(wrapper.vm.refresh.lastUpdateLabel).to.equal('Last updated a moment ago');
  });

  it('Should refresh data if older than 30s', function () {
    Date.now = sinon.stub().returns(1528190409842);
    wrapper.vm.$store.state.experiments.stats.datetime = 1128190409842;
    wrapper.vm.timer(context);
    expect(actions.getUserExperiments.calledTwice).to.equal(true);
    expect(wrapper.vm.refresh.lastUpdateLabel).to.equal('Last updated over 30 seconds ago');
  });

  it('Should not refresh data if older than 30s but request is pending', function () {
    Date.now = sinon.stub().returns(1528190409842);
    wrapper.vm.$store.state.experiments.stats.datetime = 1128190409842;
    wrapper.vm.$store.state.fetchingDataActive = true;
    wrapper.vm.timer(context);
    expect(actions.getUserExperiments.calledOnce).to.equal(true);
    expect(wrapper.vm.refresh.lastUpdateLabel).to.equal('Last updated over 30 seconds ago');
  });

  it('Should clear all filters on clear action', function () {
    wrapper.vm.filterByValModals.name.params = [1,2,3,4];
    wrapper.vm.clearFilter();
    expect(wrapper.vm.filterByValModals.name.params).to.deep.equal([]);
  });

  it('Should not format unknown value', function () {
    const value = 4;
    const result = wrapper.vm.parseValue('test', value);
    expect(result).to.deep.equal(value);
  });

  it('Should return default string if trainingStartTime value empty', function () {
    const value = null;
    const expectedResult = '---';
    const result = wrapper.vm.parseValue('trainingStartTime', value);
    expect(result).to.deep.equal(expectedResult);
  });

  it('Should return correct duration time for training', function () {
    const trainingDurationTime = 262861000;
    const expectedResult = '3 day(s), 1 hour(s), 1 min(s), 1 s';
    const result = wrapper.vm.parseValue('trainingDurationTime', trainingDurationTime);
    expect(result).to.deep.equal(expectedResult);
  });

  it('Should return default string if training duration time is a negative value', function () {
    const trainingDurationTime = -262861000;
    const expectedResult = '0 day(s), 0 hour(s), 0 min(s), 0 s';
    const result = wrapper.vm.parseValue('trainingDurationTime', trainingDurationTime);
    expect(result).to.deep.equal(expectedResult);
  });

  it('Should hide filter windows before showing others', function () {
    wrapper.vm.filterByValModals.name.visible = true;
    wrapper.vm.switchFilterWindow('namespace', true);
    expect(wrapper.vm.filterByValModals.name.visible).to.deep.equal(false);
  });

  it('Should set filters on apply click', function () {
    wrapper.vm.filterByValModals.name.visible = true;
    const draft = [1, 2, 3, 4, 5];
    wrapper.vm.onApplyValuesColumnFilter('name', draft);
    expect(wrapper.vm.filterByValModals.name.params).to.deep.equal(draft);
    expect(wrapper.vm.filterByValModals.name.visible).to.deep.equal(false);
  });

  it('Should return label for header if key is known', function () {
    const headerKey = 'name';
    const label = wrapper.vm.getLabel(headerKey);
    expect(label).to.not.equal(headerKey);
  });

  it('Should return headerKey for header if key is unknown', function () {
    const headerKey = 'xyz';
    const expectedHeaderKey = 'Xyz';
    const label = wrapper.vm.getLabel(headerKey);
    expect(label).to.equal(expectedHeaderKey);
  });

  it('Should return false if column is invisible', function () {
    const columnName = 'param3';
    wrapper.vm.hiddenColumns = [];
    const result = wrapper.vm.isVisibleColumn(columnName);
    expect(result).to.equal(false);
  });

  it('Should return true if column is visible', function () {
    const columnName = 'param3';
    wrapper.vm.selectedByUserColumns = [columnName];
    const result = wrapper.vm.isVisibleColumn(columnName);
    expect(result).to.equal(true);
  });

  it('Should return true if column is filterable by value', function () {
    const columnName = 'name';
    const result = wrapper.vm.isFilterableByValColumn(columnName);
    expect(result).to.equal(true);
  });

  it('Should return false if column is filterable by value', function () {
    const columnName = 'xyz';
    const result = wrapper.vm.isFilterableByValColumn(columnName);
    expect(result).to.equal(false);
  });

  it('Should return false if details invisible', function () {
    const expName = 'xyz';
    const result = wrapper.vm.areDetailsVisible(expName);
    expect(result).to.equal(false);
  });

  it('Should return true if details visible', function () {
    const expName = 'xyz';
    wrapper.vm.visibleDetails.push(expName);
    const result = wrapper.vm.areDetailsVisible(expName);
    expect(result).to.equal(true);
  });

  it('Should add exp to visibility list if not visible', function (done) {
    const expName = 'xyz';
    wrapper.vm.toggleDetails(expName);
    defered.resolve();
    process.nextTick(() => {
      expect(wrapper.vm.visibleDetails.includes(expName)).to.equal(true);
      done();
    });
  });

  it('Should remove exp from visibility list if visible', function (done) {
    const expName = 'xyz';
    wrapper.vm.visibleDetails.push(expName);
    wrapper.vm.toggleDetails(expName);
    defered.resolve();
    process.nextTick(() => {
      expect(wrapper.vm.visibleDetails.includes(expName)).to.equal(false);
      done();
    });
  });

  it('Should refresh experiments resources data if any details visible', function (done) {
    const expName = 'xyz';
    wrapper.vm.visibleDetails.push(expName);
    wrapper.vm.getData(expName);
    process.nextTick(() => {
      expect(actions.getExperimentResources.calledTwice).to.equal(true); // first on component init, second on getData
      done();
    });
  });
});
